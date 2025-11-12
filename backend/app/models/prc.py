from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from app.core.database import Base

class School(Base):
    __tablename__ = "schools"

    id = Column(Integer, primary_key=True, index=True)
    school_name = Column(String, unique=True, nullable=False)

class Process(Base):
    __tablename__ = "processes"

    id = Column(Integer, primary_key=True, index=True)
    process_name = Column(String, unique=True, nullable=False)
    school_id = Column(Integer, ForeignKey("schools.id"), nullable=False)
    encargado_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    estado = Column(String, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    school = relationship("School", backref="processes")
    encargado = relationship("User", backref="assigned_processes")

