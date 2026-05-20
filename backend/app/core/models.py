from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship

class Repository(SQLModel, table=True):
    __tablename__ = "repositories"
    
    id: str = Field(primary_key=True)
    name: str
    url: Optional[str] = None
    status: str = Field(default="pending") # pending, indexing, active, failed
    created_at: datetime = Field(default_factory=datetime.utcnow)

class IndexedFile(SQLModel, table=True):
    __tablename__ = "indexed_files"
    
    id: str = Field(primary_key=True)
    repo_id: str = Field(foreign_key="repositories.id", index=True)
    file_path: str
    content: str
    sha256: str
    lines_count: int

class Symbol(SQLModel, table=True):
    __tablename__ = "symbols"
    
    id: str = Field(primary_key=True)
    repo_id: str = Field(foreign_key="repositories.id", index=True)
    file_path: str
    name: str = Field(index=True)
    type: str  # class, function, import, api_route, interface
    start_line: int
    end_line: int
    signature: Optional[str] = None

class GraphEdge(SQLModel, table=True):
    __tablename__ = "graph_edges"
    
    id: str = Field(primary_key=True)
    repo_id: str = Field(foreign_key="repositories.id", index=True)
    source: str  # source node (e.g. file path or symbol name)
    target: str  # target node
    type: str    # import, call, inheritance

class SecurityReport(SQLModel, table=True):
    __tablename__ = "security_reports"
    
    id: str = Field(primary_key=True)
    repo_id: str = Field(foreign_key="repositories.id", index=True)
    file_path: str
    severity: str  # CRITICAL, HIGH, MEDIUM, LOW
    rule_id: str
    description: str
    lines_range: str
    remediation: str

class Conversation(SQLModel, table=True):
    __tablename__ = "conversations"
    
    id: str = Field(primary_key=True)
    repo_id: str = Field(foreign_key="repositories.id", index=True)
    title: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Message(SQLModel, table=True):
    __tablename__ = "messages"
    
    id: str = Field(primary_key=True)
    conversation_id: str = Field(foreign_key="conversations.id", index=True)
    role: str  # user, assistant
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AgentMemory(SQLModel, table=True):
    __tablename__ = "agent_memories"
    
    id: str = Field(primary_key=True)
    repo_id: str = Field(foreign_key="repositories.id", index=True)
    key: str = Field(index=True)
    value: str
    updated_at: datetime = Field(default_factory=datetime.utcnow)
