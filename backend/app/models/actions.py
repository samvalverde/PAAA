from sqlalchemy import Column, Integer, ForeignKey, DateTime, func, String
from sqlalchemy.orm import relationship
from app.core.database import Base

class Action(Base):
    __tablename__ = "actions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    process_id = Column(Integer, ForeignKey("processes.id"), nullable=False)
    action_type_id = Column(Integer, ForeignKey("action_types.id"), nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="actions")
    process = relationship("Process", back_populates="actions")
    action_type = relationship("ActionType", back_populates="actions")

class ActionType(Base):
    __tablename__ = "action_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(String)

    actions = relationship("Action", back_populates="action_type")
    audit_logs = relationship("AuditLog", back_populates="action_type")
