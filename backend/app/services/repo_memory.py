from sqlmodel import Session, select
from app.core.models import AgentMemory
from datetime import datetime
from typing import Optional
import uuid

class RepositoryMemory:
    @staticmethod
    def get_memory(session: Session, repo_id: str, key: str) -> Optional[str]:
        statement = select(AgentMemory).where(AgentMemory.repo_id == repo_id, AgentMemory.key == key)
        record = session.exec(statement).first()
        return record.value if record else None

    @staticmethod
    def set_memory(session: Session, repo_id: str, key: str, value: str):
        statement = select(AgentMemory).where(AgentMemory.repo_id == repo_id, AgentMemory.key == key)
        record = session.exec(statement).first()
        
        if record:
            record.value = value
            record.updated_at = datetime.utcnow()
        else:
            record = AgentMemory(
                id=str(uuid.uuid4()),
                repo_id=repo_id,
                key=key,
                value=value
            )
            session.add(record)
            
        session.commit()

    @staticmethod
    def get_all_memories(session: Session, repo_id: str) -> list[AgentMemory]:
        statement = select(AgentMemory).where(AgentMemory.repo_id == repo_id)
        return list(session.exec(statement).all())
