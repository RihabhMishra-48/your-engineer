from sqlmodel import Session, select
from app.core.models import IndexedFile, SecurityReport
import uuid
import re
import os

class SecurityAnalyzer:
    @staticmethod
    def run_scan(session: Session, repo_id: str) -> list[SecurityReport]:
        # Clear old security reports for this repo
        existing = session.exec(select(SecurityReport).where(SecurityReport.repo_id == repo_id)).all()
        for r in existing:
            session.delete(r)
        session.commit()

        files = session.exec(select(IndexedFile).where(IndexedFile.repo_id == repo_id)).all()
        
        # Hardcoded Secret Regexes
        secret_patterns = {
            "AWS API Key": re.compile(r'AKIA[0-9A-Z]{16}'),
            "Exposed JWT Secret": re.compile(r'(?:jwt|jwt_secret|token_secret|session_secret)\s*=\s*[\'"][a-zA-Z0-9_\-\.\!@#\$%\^&\*\(\)]{8,}[\'"]', re.IGNORECASE),
            "Generic Password/Secret Key": re.compile(r'(?:password|secret_key|db_password)\s*=\s*[\'"][a-zA-Z0-9_\-\.]{6,}[\'"]', re.IGNORECASE),
            "Slack OAuth Token": re.compile(r'xox[bapr]-[0-9]{12}'),
        }

        # SQL Injection patterns
        sqli_patterns = [
            (re.compile(r'execute\s*\(\s*[\'"]SELECT\s+.*?\s+WHERE\s+.*?[\'"]\s*\+\s*\w+', re.IGNORECASE), "Direct String SQL Concatenation"),
            (re.compile(r'execute\s*\(\s*f[\'"]SELECT\s+.*?\s+WHERE\s+.*?\{.*?\}.*?[\'"]', re.IGNORECASE), "F-String Unsafe SQL Execution"),
            (re.compile(r'execute\s*\(\s*[\'"]SELECT\s+.*?%s.*?[\'"]\s*%\s*\(.*?\)', re.IGNORECASE), "Percent-formatted SQL Interpolation")
        ]

        # Command injection patterns
        cmd_patterns = [
            (re.compile(r'subprocess\.(?:call|run|Popen)\s*\(\s*[\'"].*?[\'"]\s*\+\s*\w+', re.IGNORECASE), "Unsafe Subprocess Invocation"),
            (re.compile(r'os\.system\s*\(\s*f?[\'"].*?\{.*?\}.*?[\'"]', re.IGNORECASE), "Unsafe OS System Invocation"),
            (re.compile(r'eval\s*\(\s*\w+\s*\)', re.IGNORECASE), "Dangerous Eval usage")
        ]

        reports = []

        for file in files:
            content = file.content
            lines = content.splitlines()
            
            # 1. Check secrets
            for label, pattern in secret_patterns.items():
                for idx, line in enumerate(lines, 1):
                    match = pattern.search(line)
                    if match:
                        reports.append(SecurityReport(
                            id=str(uuid.uuid4()),
                            repo_id=repo_id,
                            file_path=file.file_path,
                            severity="CRITICAL",
                            rule_id="HARDCODED_SECRET",
                            description=f"Detected potential {label} on line {idx}: `{line.strip()[:40]}...`",
                            lines_range=f"{idx}",
                            remediation="Extract private tokens and passwords into standard environment variables loaded from a secure vault or .env configuration."
                        ))

            # 2. Check SQL Injection
            for pattern, name in sqli_patterns:
                for idx, line in enumerate(lines, 1):
                    match = pattern.search(line)
                    if match:
                        reports.append(SecurityReport(
                            id=str(uuid.uuid4()),
                            repo_id=repo_id,
                            file_path=file.file_path,
                            severity="HIGH",
                            rule_id="SQL_INJECTION",
                            description=f"Detected raw query SQL Injection vulnerability via {name} on line {idx}.",
                            lines_range=f"{idx}",
                            remediation="Use structured parameterized queries (e.g. prepared statements or ORM abstractions) instead of dynamically compounding query parameters."
                        ))

            # 3. Check Command Injection
            for pattern, name in cmd_patterns:
                for idx, line in enumerate(lines, 1):
                    match = pattern.search(line)
                    if match:
                        reports.append(SecurityReport(
                            id=str(uuid.uuid4()),
                            repo_id=repo_id,
                            file_path=file.file_path,
                            severity="HIGH",
                            rule_id="COMMAND_INJECTION",
                            description=f"Detected dangerous shell command injection risk via {name} on line {idx}.",
                            lines_range=f"{idx}",
                            remediation="Avoid invoking raw shell operations with parameters. Use standard library modules (like os/shutil) or sanitize user parameters strict-match lists."
                        ))

            # 4. Check Unsafe Authentication or JWT
            if "jwt" in file.file_path.lower() or "auth" in file.file_path.lower():
                for idx, line in enumerate(lines, 1):
                    if "verify=False" in line or "verify_signature=False" in line or "algorithms=['none']" in line or 'algorithms=["none"]' in line:
                        reports.append(SecurityReport(
                            id=str(uuid.uuid4()),
                            repo_id=repo_id,
                            file_path=file.file_path,
                            severity="HIGH",
                            rule_id="UNSAFE_JWT_DECODING",
                            description=f"Detected disabled signature verification during JWT authentication parse on line {idx}.",
                            lines_range=f"{idx}",
                            remediation="Always enforce proper signature and algorithm verification (e.g. HS256/RS256) when decoding JSON Web Tokens to prevent authentication bypasses."
                        ))
                        
        for rep in reports:
            session.add(rep)
        session.commit()
        return reports
