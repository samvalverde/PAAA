from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.user import School

class Process(Base):
    __tablename__ = "processes"

    id = Column(Integer, primary_key=True, index=True)
    process_name = Column(String, unique=True, nullable=False)
    school_id = Column(Integer, ForeignKey("schools.id"), nullable=False)
    encargado_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    estado = Column(String, default="pendiente")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relaciones
    encargado = relationship("User", back_populates="processes")
    school = relationship("School", back_populates="processes")
    actions = relationship("Action", back_populates="process")
