from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select
from app.core.database import get_session, create_db_and_tables
from app.core.models import Repository, IndexedFile, Symbol, SecurityReport, AgentMemory
from app.services.symbol_indexer import SymbolIndexer
from app.services.dependency_graph import DependencyGraph
from app.services.rag_engine import RAGEngine
from app.services.security_analyzer import SecurityAnalyzer
from app.services.agent_orchestrator import AgentOrchestrator
from app.services.repo_memory import RepositoryMemory
import os
import shutil
import tempfile
import uuid
import asyncio
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

router = APIRouter()

# In-memory indexing status tracker
indexing_status = {
    "status": "idle", # idle, indexing, active, failed
    "progress": 0,
    "current_step": "No active repository indexed.",
    "repo_id": None
}

class QueryRequest(BaseModel):
    query: str
    repo_id: str

class RepoUrlRequest(BaseModel):
    url: str

def format_sse(data: str) -> str:
    return f"data: {data}\n\n"

def traverse_dir(path: str, base_path: str) -> List[Dict[str, Any]]:
    tree = []
    try:
        for entry in os.scandir(path):
            # Skip noise folders
            if entry.name in [".git", "node_modules", "venv", "__pycache__", "dist", ".next", ".gemini", "copilot.db"]:
                continue
            
            rel_path = os.path.relpath(entry.path, base_path)
            
            if entry.is_dir():
                children = traverse_dir(entry.path, base_path)
                tree.append({
                    "name": entry.name,
                    "path": rel_path,
                    "type": "directory",
                    "children": children
                })
            else:
                tree.append({
                    "name": entry.name,
                    "path": rel_path,
                    "type": "file"
                })
    except Exception:
        pass
    
    # Sort directories first, then alphabetically
    tree.sort(key=lambda x: (x["type"] != "directory", x["name"].lower()))
    return tree

async def background_indexer(repo_path: str, repo_id: str, db_url: str):
    global indexing_status
    session = Session(get_session().__next__().bind)
    
    try:
        # Step 1: Scanning files
        indexing_status["status"] = "indexing"
        indexing_status["progress"] = 20
        indexing_status["current_step"] = "Cloning repository & scanning file structure..."
        await asyncio.sleep(1.0)

        # Clear old database records for this repo
        files = session.exec(select(IndexedFile).where(IndexedFile.repo_id == repo_id)).all()
        for f in files:
            session.delete(f)
        session.commit()

        valid_files = []
        for root, dirs, filenames in os.walk(repo_path):
            # Prune noise directories
            dirs[:] = [d for d in dirs if d not in [".git", "node_modules", "venv", "__pycache__", "dist", ".next", ".gemini", "copilot.db"]]
            
            for fname in filenames:
                ext = fname.split('.')[-1].lower() if '.' in fname else ""
                if ext in ["py", "js", "jsx", "ts", "tsx", "go", "rs", "java", "json", "md", "css", "html"]:
                    full_p = os.path.join(root, fname)
                    rel_p = os.path.relpath(full_p, repo_path)
                    try:
                        with open(full_p, "r", encoding="utf-8", errors="ignore") as f:
                            content = f.read()
                        
                        import hashlib
                        sha = hashlib.sha256(content.encode()).hexdigest()
                        
                        db_file = IndexedFile(
                            id=str(uuid.uuid4()),
                            repo_id=repo_id,
                            file_path=rel_p,
                            content=content,
                            sha256=sha,
                            lines_count=len(content.splitlines())
                        )
                        session.add(db_file)
                        valid_files.append((rel_p, content))
                    except Exception:
                        pass
        session.commit()

        # Step 2: Parsing AST symbols
        indexing_status["progress"] = 40
        indexing_status["current_step"] = "Extracting AST symbols (functions, classes, interfaces)..."
        await asyncio.sleep(1.2)

        for rel_p, content in valid_files:
            SymbolIndexer.index_file_symbols(session, repo_id, rel_p, content)

        # Step 3: Building graph edges
        indexing_status["progress"] = 60
        indexing_status["current_step"] = "Resolving imports & building structural dependency graph..."
        await asyncio.sleep(1.2)
        
        DependencyGraph.build_graph(session, repo_id)

        # Step 4: Generating RAG embeddings
        indexing_status["progress"] = 80
        indexing_status["current_step"] = "Creating dense semantic vectors & building BM25 index..."
        await asyncio.sleep(1.2)
        
        RAGEngine.index_repository(session, repo_id)

        # Step 5: Scanning Security Vulnerabilities
        indexing_status["progress"] = 90
        indexing_status["current_step"] = "Static analysis scanning for security vulnerability patterns..."
        await asyncio.sleep(1.0)
        
        SecurityAnalyzer.run_scan(session, repo_id)

        # Finished
        indexing_status["status"] = "active"
        indexing_status["progress"] = 100
        indexing_status["current_step"] = "Repository successfully indexed. Workspace active!"
        
        # Update Repo Status
        repo = session.get(Repository, repo_id)
        if repo:
            repo.status = "active"
            session.add(repo)
            session.commit()
            
    except Exception as e:
        indexing_status["status"] = "failed"
        indexing_status["current_step"] = f"Failed to index: {str(e)}"
        repo = session.get(Repository, repo_id)
        if repo:
            repo.status = "failed"
            session.add(repo)
            session.commit()
    finally:
        session.close()

@router.post("/upload-repo")
async def upload_repo(
    background_tasks: BackgroundTasks,
    url: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_session)
):
    global indexing_status
    repo_id = str(uuid.uuid4())
    
    # Create or update repository table row
    repo_name = "Self Analysis Codebase"
    
    # Create temp directory
    temp_dir = tempfile.mkdtemp()
    
    if file:
        # Unzip file to temp dir
        import zipfile
        zip_path = os.path.join(temp_dir, "upload.zip")
        with open(zip_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        try:
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(temp_dir)
            os.remove(zip_path)
            repo_name = file.filename or "Uploaded Archive"
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid ZIP file: {str(e)}")
            
    elif url:
        # Clone repository
        repo_name = url.split('/')[-1].replace('.git', '')
        # For this demonstrator, if the URL is "self" or "local", we point directly to the backend itself!
        if url.lower() in ["self", "local", "backend"]:
            # Copy backend code to temp dir
            local_src = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            shutil.copytree(local_src, os.path.join(temp_dir, "backend_src"), ignore=shutil.ignore_patterns('venv', '.git', '__pycache__', 'copilot.db'))
            temp_dir = os.path.join(temp_dir, "backend_src")
            repo_name = "AI Copilot Self Source"
        else:
            # Spawn a shallow git clone
            indexing_status["status"] = "indexing"
            indexing_status["current_step"] = f"Cloning remote repository {url}..."
            try:
                import subprocess
                subprocess.run(["git", "clone", "--depth", "1", url, os.path.join(temp_dir, "cloned")], check=True)
                temp_dir = os.path.join(temp_dir, "cloned")
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Git clone failed: {str(e)}")
    else:
        # Point directly to backend directory as default fallback
        local_src = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        shutil.copytree(local_src, os.path.join(temp_dir, "backend_src"), ignore=shutil.ignore_patterns('venv', '.git', '__pycache__', 'copilot.db'))
        temp_dir = os.path.join(temp_dir, "backend_src")
        repo_name = "AI Copilot Self Source"

    repo = Repository(id=repo_id, name=repo_name, url=url, status="indexing")
    db.add(repo)
    db.commit()
    
    indexing_status = {
        "status": "indexing",
        "progress": 5,
        "current_step": "Initializing repository sandbox...",
        "repo_id": repo_id
    }
    
    # Start background indexing
    background_tasks.add_task(background_indexer, temp_dir, repo_id, settings.DATABASE_URL)
    
    return {"repo_id": repo_id, "name": repo_name, "status": "indexing"}

@router.get("/upload-status")
async def get_upload_status():
    return indexing_status

@router.post("/query")
async def query_copilot(req: QueryRequest, db: Session = Depends(get_session)):
    async def sse_generator():
        try:
            async for payload in AgentOrchestrator.query_stream(db, req.repo_id, req.query):
                yield format_sse(payload)
        except Exception as e:
            yield format_sse(json.dumps({"type": "error", "message": str(e)}))
            
    return StreamingResponse(sse_generator(), media_type="text/event-stream")

@router.get("/graph")
async def get_graph(repo_id: str, db: Session = Depends(get_session)):
    graph = DependencyGraph.get_react_flow_graph(db, repo_id)
    return graph

@router.get("/files")
async def get_files(repo_id: str, db: Session = Depends(get_session)):
    # Find all indexed file paths for this repo
    files = db.exec(select(IndexedFile).where(IndexedFile.repo_id == repo_id)).all()
    if not files:
        return []
        
    # We reconstruct a virtual folder tree based on files from this repo
    # To do this safely, we build a local temporary folder with file names or do virtual tree parsing.
    # Virtual tree parsing is fast and direct!
    root_nodes = []
    
    for f in files:
        parts = f.file_path.split('/')
        current_level = root_nodes
        
        for idx, part in enumerate(parts):
            is_last = (idx == len(parts) - 1)
            rel_path = "/".join(parts[:idx+1])
            
            # Check if this node already exists
            existing_node = next((node for node in current_level if node["name"] == part), None)
            
            if not existing_node:
                if is_last:
                    new_node = {
                        "name": part,
                        "path": rel_path,
                        "type": "file"
                    }
                else:
                    new_node = {
                        "name": part,
                        "path": rel_path,
                        "type": "directory",
                        "children": []
                    }
                current_level.append(new_node)
                current_level = new_node.get("children", [])
            else:
                current_level = existing_node.get("children", [])
                
    # Sort files
    def sort_tree(tree):
        tree.sort(key=lambda x: (x.get("type") != "directory", x["name"].lower()))
        for item in tree:
            if "children" in item:
                sort_tree(item["children"])
                
    sort_tree(root_nodes)
    return root_nodes

@router.get("/file-content")
async def get_file_content(repo_id: str, file_path: str, db: Session = Depends(get_session)):
    file = db.exec(
        select(IndexedFile).where(IndexedFile.repo_id == repo_id, IndexedFile.file_path == file_path)
    ).first()
    
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
        
    return {"file_path": file.file_path, "content": file.content}

@router.get("/security-report")
async def get_security_report(repo_id: str, db: Session = Depends(get_session)):
    reports = db.exec(select(SecurityReport).where(SecurityReport.repo_id == repo_id)).all()
    return reports

@router.get("/symbols")
async def get_symbols(repo_id: str, db: Session = Depends(get_session)):
    symbols = db.exec(select(Symbol).where(Symbol.repo_id == repo_id)).all()
    return symbols

@router.get("/memory")
async def get_memory(repo_id: str, db: Session = Depends(get_session)):
    memories = RepositoryMemory.get_all_memories(db, repo_id)
    return memories

@router.get("/reindex")
async def force_reindex(repo_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_session)):
    global indexing_status
    repo = db.get(Repository, repo_id)
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
        
    temp_dir = tempfile.mkdtemp()
    
    # Point directly to self backend as default mock source for reindex
    local_src = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    shutil.copytree(local_src, os.path.join(temp_dir, "backend_src"), ignore=shutil.ignore_patterns('venv', '.git', '__pycache__', 'copilot.db'))
    temp_dir = os.path.join(temp_dir, "backend_src")
    
    indexing_status = {
        "status": "indexing",
        "progress": 5,
        "current_step": "Re-initializing indexing engine...",
        "repo_id": repo_id
    }
    
    background_tasks.add_task(background_indexer, temp_dir, repo_id, settings.DATABASE_URL)
    return {"status": "indexing"}
