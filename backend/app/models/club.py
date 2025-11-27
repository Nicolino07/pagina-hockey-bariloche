from sqlalchemy import Column, Integer, String
from app.database import Base

class Club(Base):
    __tablename__ = "club"

    id_club = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    provincia = Column(String)
    ciudad = Column(String)
    direccion = Column(String)
    telefono = Column(String)
    email = Column(String)
