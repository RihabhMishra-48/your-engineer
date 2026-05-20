from sqlmodel import Session, select
from app.core.models import IndexedFile, GraphEdge, Symbol
from app.services.ast_engine import ASTParser
import uuid
import os

class DependencyGraph:
    @staticmethod
    def build_graph(session: Session, repo_id: str):
        # Clear old edges
        existing = session.exec(select(GraphEdge).where(GraphEdge.repo_id == repo_id)).all()
        for edge in existing:
            session.delete(edge)
        session.commit()

        # Retrieve all files
        files = session.exec(select(IndexedFile).where(IndexedFile.repo_id == repo_id)).all()
        file_paths = {os.path.basename(f.file_path): f.file_path for f in files}
        full_paths = {f.file_path for f in files}

        for file in files:
            parsed = ASTParser.parse_file(file.content, file.file_path)
            
            # Resolve imports
            for imp in parsed.imports:
                imp_name = imp["name"]
                target_path = None
                
                # Try direct matching
                if imp_name in full_paths:
                    target_path = imp_name
                else:
                    # Match by basename (e.g. import UserService matching user_service.py)
                    base = imp_name.split('.')[-1].split('/')[-1]
                    for bname, fpath in file_paths.items():
                        b_no_ext = os.path.splitext(bname)[0]
                        if base.lower() in b_no_ext.lower() or b_no_ext.lower() in base.lower():
                            target_path = fpath
                            break
                
                if target_path and target_path != file.file_path:
                    db_edge = GraphEdge(
                        id=str(uuid.uuid4()),
                        repo_id=repo_id,
                        source=file.file_path,
                        target=target_path,
                        type="import"
                    )
                    session.add(db_edge)
        session.commit()

    @staticmethod
    def get_react_flow_graph(session: Session, repo_id: str) -> dict:
        files = session.exec(select(IndexedFile).where(IndexedFile.repo_id == repo_id)).all()
        edges = session.exec(select(GraphEdge).where(GraphEdge.repo_id == repo_id)).all()
        symbols = session.exec(select(Symbol).where(Symbol.repo_id == repo_id)).all()

        nodes_list = []
        edges_list = []

        # Position layout: simple grid/circle layout to prevent overlap
        import math
        radius = 220
        angle_step = (2 * math.pi) / len(files) if files else 1

        for idx, f in enumerate(files):
            angle = idx * angle_step
            x = 400 + radius * math.cos(angle) * (1 + 0.3 * (idx % 2))
            y = 300 + radius * math.sin(angle) * (1 + 0.3 * (idx % 2))
            
            # Color coding based on file type
            ext = f.file_path.split('.')[-1].lower() if '.' in f.file_path else "txt"
            color = "#3b82f6" # blue
            if ext in ["py"]:
                color = "#10b981" # emerald
            elif ext in ["js", "jsx", "ts", "tsx"]:
                color = "#f59e0b" # amber
            elif ext in ["go"]:
                color = "#06b6d4" # cyan
            elif ext in ["rs"]:
                color = "#ef4444" # red
            
            # Symbols list for rendering inside tooltips
            file_symbols = [s.name for s in symbols if s.file_path == f.file_path][:5]

            nodes_list.append({
                "id": f.file_path,
                "type": "default",
                "data": {
                    "label": os.path.basename(f.file_path),
                    "path": f.file_path,
                    "color": color,
                    "symbols": file_symbols,
                    "lines": f.lines_count
                },
                "position": {"x": x, "y": y},
                "style": {
                    "background": "#121214",
                    "color": "#e4e4e7",
                    "border": f"1px solid {color}",
                    "borderRadius": "6px",
                    "padding": "10px",
                    "fontSize": "11px",
                    "fontFamily": "JetBrains Mono, monospace",
                    "width": 140,
                    "boxShadow": f"0 4px 12px {color}15"
                }
            })

        for edge in edges:
            edges_list.append({
                "id": edge.id,
                "source": edge.source,
                "target": edge.target,
                "animated": True,
                "style": {"stroke": "#52525b", "strokeWidth": 1.5},
                "type": "smoothstep"
            })

        return {"nodes": nodes_list, "edges": edges_list}
