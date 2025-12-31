import enum
from sqlalchemy import Column, Integer, String, Boolean, TIMESTAMP, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import ENUM
from app.database import Base
from datetime import datetime
from sqlalchemy.dialects.postgresql import INET



class Usuario(Base):
    __tablename__ = "usuario"

    id_usuario = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True)
    password_hash = Column(String, nullable=False)

    rol = Column(
        ENUM(
            "superusuario",
            "admin",
            "editor",
            "lector",
            name="rol_usuario_tipo",
            create_type=False
        ),
        nullable=False
    )

    activo = Column(Boolean, default=True)
    id_persona = Column(Integer, ForeignKey("persona.id_persona"))

    ultimo_login = Column(TIMESTAMP)
    intentos_fallidos = Column(Integer, default=0)
    bloqueado_hasta = Column(TIMESTAMP)

    creado_en = Column(TIMESTAMP)
    actualizado_en = Column(TIMESTAMP)
    creado_por = Column(String(100))
    actualizado_por = Column(String(100))



class RefreshToken(Base):
    __tablename__ = "refresh_token"

    id_refresh_token = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey("usuario.id_usuario", ondelete="CASCADE"), nullable=False)
    token_hash = Column(String, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    revoked = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by_ip = Column(INET)
    user_agent = Column(String)

class RolUsuario(str, enum.Enum):
   
    superusuario = "superusuario"
    admin = "admin"
    editor = "editor"
    lector = "lector"