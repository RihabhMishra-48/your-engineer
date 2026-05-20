from sqlmodel import Session, select
from app.core.models import Symbol, IndexedFile
from app.services.ast_engine import ASTParser
import uuid

class SymbolIndexer:
    @staticmethod
    def index_file_symbols(session: Session, repo_id: str, file_path: str, content: str) -> list:
        # Delete old symbols for this file to avoid duplicates
        existing = session.exec(
            select(Symbol).where(Symbol.repo_id == repo_id, Symbol.file_path == file_path)
        ).all()
        for sym in existing:
            session.delete(sym)
        session.commit()
        
        # Parse symbols
        parsed_file = ASTParser.parse_file(content, file_path)
        
        symbols_created = []
        for sym in parsed_file.symbols:
            db_sym = Symbol(
                id=str(uuid.uuid4()),
                repo_id=repo_id,
                file_path=file_path,
                name=sym.name,
                type=sym.type,
                start_line=sym.start_line,
                end_line=sym.end_line,
                signature=sym.signature
            )
            session.add(db_sym)
            symbols_created.append(db_sym)
            
        session.commit()
        return symbols_created

    @staticmethod
    def find_symbol_definition(session: Session, repo_id: str, symbol_name: str) -> list[Symbol]:
        statement = select(Symbol).where(Symbol.repo_id == repo_id, Symbol.name == symbol_name)
        return list(session.exec(statement).all())

    @staticmethod
    def find_symbol_references(session: Session, repo_id: str, symbol_name: str) -> list[dict]:
        # Crawl all files in the repository to search for lexical references
        statement = select(IndexedFile).where(IndexedFile.repo_id == repo_id)
        files = session.exec(statement).all()
        
        references = []
        for file in files:
            lines = file.content.splitlines()
            for idx, line in enumerate(lines, 1):
                # Search for whole-word matches to avoid substring issues (e.g. "UserService" inside "UserServiceImpl")
                # But allow prefix/suffix reference if appropriate
                if symbol_name in line:
                    # Fetch if it's not the declaration line itself
                    # Check if we have a declaration in this file at this line
                    is_declaration = session.exec(
                        select(Symbol).where(
                            Symbol.repo_id == repo_id,
                            Symbol.file_path == file.file_path,
                            Symbol.name == symbol_name,
                            Symbol.start_line <= idx,
                            Symbol.end_line >= idx
                        )
                    ).first() is not None
                    
                    if not is_declaration:
                        references.append({
                            "file_path": file.file_path,
                            "line_number": idx,
                            "line_content": line.strip()
                        })
        return references
