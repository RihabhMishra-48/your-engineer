import ast
import re
from typing import List, Dict, Any, Optional

class ParsedSymbol:
    def __init__(self, name: str, symbol_type: str, start_line: int, end_line: int, signature: Optional[str] = None):
        self.name = name
        self.type = symbol_type  # class, function, import, api_route
        self.start_line = start_line
        self.end_line = end_line
        self.signature = signature

class ParsedFile:
    def __init__(self, file_path: str):
        self.file_path = file_path
        self.symbols: List[ParsedSymbol] = []
        self.imports: List[Dict[str, Any]] = []
        self.dependencies: List[str] = []

class ASTParser:
    @staticmethod
    def parse_python(content: str, file_path: str) -> ParsedFile:
        parsed = ParsedFile(file_path)
        try:
            tree = ast.parse(content)
        except Exception:
            # Fallback to lexical if python syntax is invalid
            return ASTParser.parse_lexical(content, file_path, "python")
        
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    parsed.imports.append({"name": alias.name, "alias": alias.asname, "line": getattr(node, "lineno", 1)})
                    parsed.dependencies.append(alias.name)
            elif isinstance(node, ast.ImportFrom):
                module = node.module or ""
                for alias in node.names:
                    parsed.imports.append({"name": f"{module}.{alias.name}", "alias": alias.asname, "line": getattr(node, "lineno", 1)})
                    parsed.dependencies.append(module)
            
            elif isinstance(node, ast.ClassDef):
                # Calculate end line
                end_line = getattr(node, "end_lineno", node.lineno)
                bases = [ast.unparse(b) for b in node.bases] if hasattr(ast, "unparse") else []
                sig = f"class {node.name}" + (f"({', '.join(bases)})" if bases else "")
                parsed.symbols.append(ParsedSymbol(
                    name=node.name,
                    symbol_type="class",
                    start_line=node.lineno,
                    end_line=end_line,
                    signature=sig
                ))
            
            elif isinstance(node, ast.FunctionDef) or isinstance(node, ast.AsyncFunctionDef):
                end_line = getattr(node, "end_lineno", node.lineno)
                args = [arg.arg for arg in node.args.args]
                sig = f"{'async ' if isinstance(node, ast.AsyncFunctionDef) else ''}def {node.name}({', '.join(args)})"
                
                # Check for API decorators
                is_route = False
                for dec in node.decorator_list:
                    dec_str = ""
                    try:
                        if isinstance(dec, ast.Call):
                            dec_str = ast.unparse(dec.func) if hasattr(ast, "unparse") else ""
                        elif isinstance(dec, ast.Attribute):
                            dec_str = ast.unparse(dec) if hasattr(ast, "unparse") else ""
                    except Exception:
                        pass
                    if "route" in dec_str or any(verb in dec_str for verb in ["get", "post", "put", "delete", "patch"]):
                        is_route = True
                
                symbol_type = "api_route" if is_route else "function"
                parsed.symbols.append(ParsedSymbol(
                    name=node.name,
                    symbol_type=symbol_type,
                    start_line=node.lineno,
                    end_line=end_line,
                    signature=sig
                ))
        return parsed

    @staticmethod
    def parse_lexical(content: str, file_path: str, language: str) -> ParsedFile:
        parsed = ParsedFile(file_path)
        lines = content.splitlines()
        
        # Regex patterns for imports
        js_import_re = re.compile(r'(?:import|export)\s+.*?\s+from\s+[\'"]([^\'"]+)[\'"]')
        go_import_re = re.compile(r'import\s+\(\s*([^\)]+)\s*\)|import\s+[\'"]([^\'"]+)[\'"]')
        rust_use_re = re.compile(r'use\s+([^;:]+)')
        
        # Find imports
        for idx, line in enumerate(lines, 1):
            line_str = line.strip()
            if language in ["typescript", "javascript"]:
                match = js_import_re.search(line_str)
                if match:
                    val = match.group(1)
                    parsed.imports.append({"name": val, "line": idx})
                    parsed.dependencies.append(val.split('/')[-1])
            elif language == "go":
                match = go_import_re.search(line_str)
                if match:
                    val = match.group(1) or match.group(2)
                    for item in val.splitlines():
                        clean = item.strip().replace('"', '')
                        if clean:
                            parsed.imports.append({"name": clean, "line": idx})
                            parsed.dependencies.append(clean.split('/')[-1])
            elif language == "rust":
                match = rust_use_re.search(line_str)
                if match:
                    val = match.group(1).strip()
                    parsed.imports.append({"name": val, "line": idx})
                    parsed.dependencies.append(val.split('::')[0])

        # Simple structural finder using curly brace nesting
        brace_level = 0
        in_symbol = False
        symbol_start = 0
        symbol_name = ""
        symbol_type = ""
        symbol_sig = ""
        
        # Unified pattern for functions and classes
        # JS/TS: function name(..), async function name(..), class name
        # Go: func name(..), func (t *T) name(..)
        # Rust: fn name(..), impl name, struct name
        # Java: public class name, public void name(..)
        patterns = {
            "typescript": [
                (re.compile(r'(?:async\s+)?function\s+(\w+)\s*\('), "function"),
                (re.compile(r'class\s+(\w+)'), "class"),
                (re.compile(r'interface\s+(\w+)'), "class"),
                (re.compile(r'(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\(.*?\)\s*=>'), "function")
            ],
            "javascript": [
                (re.compile(r'(?:async\s+)?function\s+(\w+)\s*\('), "function"),
                (re.compile(r'class\s+(\w+)'), "class")
            ],
            "go": [
                (re.compile(r'func\s+(?:\([^\)]+\)\s+)?(\w+)\s*\('), "function"),
                (re.compile(r'type\s+(\w+)\s+struct'), "class")
            ],
            "rust": [
                (re.compile(r'fn\s+(\w+)\s*(?:<.*?>)?\s*\('), "function"),
                (re.compile(r'struct\s+(\w+)'), "class"),
                (re.compile(r'impl\s+(?:.*?\s+for\s+)?(\w+)'), "class")
            ],
            "java": [
                (re.compile(r'(?:public|private|protected|static|final|\s)+\s+class\s+(\w+)'), "class"),
                (re.compile(r'(?:public|private|protected|static|\s)+\s+[\w<>]+\s+(\w+)\s*\([^\)]*\)\s*(?:throws\s+\w+)?\s*\{'), "function")
            ]
        }
        
        lang_pats = patterns.get(language, [])
        
        for idx, line in enumerate(lines, 1):
            line_str = line.strip()
            
            # Simple brace count (handles JS/TS/Go/Rust/Java)
            opens = line_str.count('{')
            closes = line_str.count('}')
            
            # Check for matches when brace level is low (top-level symbols)
            if brace_level == 0:
                for regex, stype in lang_pats:
                    m = regex.search(line_str)
                    if m:
                        symbol_name = m.group(1)
                        symbol_type = stype
                        symbol_start = idx
                        symbol_sig = line_str
                        in_symbol = True
                        break
            
            brace_level += opens
            brace_level -= closes
            
            if brace_level < 0:
                brace_level = 0
                
            if in_symbol and brace_level == 0:
                parsed.symbols.append(ParsedSymbol(
                    name=symbol_name,
                    symbol_type=symbol_type,
                    start_line=symbol_start,
                    end_line=idx,
                    signature=symbol_sig
                ))
                in_symbol = False
                
        return parsed

    @classmethod
    def parse_file(cls, content: str, file_path: str) -> ParsedFile:
        ext = file_path.split('.')[-1].lower() if '.' in file_path else ""
        if ext == "py":
            return cls.parse_python(content, file_path)
        elif ext in ["ts", "tsx"]:
            return cls.parse_lexical(content, file_path, "typescript")
        elif ext in ["js", "jsx"]:
            return cls.parse_lexical(content, file_path, "javascript")
        elif ext == "go":
            return cls.parse_lexical(content, file_path, "go")
        elif ext == "rs":
            return cls.parse_lexical(content, file_path, "rust")
        elif ext == "java":
            return cls.parse_lexical(content, file_path, "java")
        else:
            return ParsedFile(file_path)
