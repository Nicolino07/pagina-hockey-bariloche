from pydantic import BaseModel
from typing import Optional


class ClubBase(BaseModel):
    nombre: str
    provincia: Optional[str] = None
    ciudad: Optional[str] = None
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None


class ClubCreate(ClubBase):
    pass


class ClubUpdate(BaseModel):
    nombre: Optional[str] = None
    provincia: Optional[str] = None
    ciudad: Optional[str] = None
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None


class Club(ClubBase):
    id_club: int

    class Config:
        from_attributes = True
