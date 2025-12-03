from pydantic import BaseModel
from typing import Optional


class ParticipanPartidoBase(BaseModel):
    id_partido: int
    id_plantel: int
    numero_camiseta: int


class ParticipanPartidoCreate(ParticipanPartidoBase):
    pass


class ParticipanPartido(ParticipanPartidoBase):
    id_participante_partido: int

    class Config:
        from_attributes = True
