from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, func
from sqlalchemy.orm import relationship
from app.core.database import Base

# =========================
class UserType(Base):
    __tablename__ = "user_types"

    id = Column(Integer, primary_key=True, index=True)
    type_name = Column(String, unique=True, nullable=False)

    # Relación inversa con usuarios
    users = relationship("User", back_populates="user_type")


# =========================
# Modelo: School
class School(Base):
    __tablename__ = "schools"

    id = Column(Integer, primary_key=True, index=True)
    school_name = Column(String, unique=True, nullable=False)

    # Relación inversa con procesos y usuarios
    processes = relationship("Process", back_populates="school")
    users = relationship("User", back_populates="school")


# =========================
# Modelo: User
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    phone_number = Column(String)

    user_type_id = Column(Integer, ForeignKey("user_types.id"), nullable=False)
    school_id = Column(Integer, ForeignKey("schools.id"), nullable=True)
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relaciones ORM (no crean columnas)
    user_type = relationship("UserType", back_populates="users")
    school = relationship("School", back_populates="users")
    processes = relationship("Process", back_populates="encargado")
    actions = relationship("Action", back_populates="user", cascade="all, delete")
