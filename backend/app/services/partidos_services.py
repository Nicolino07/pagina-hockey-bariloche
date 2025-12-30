from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.persona import Persona
from requests import Session


def validar_arbitro(db: Session, id_persona: int):
    persona = db.get(Persona, id_persona)
    if not persona:
        raise ValueError("Persona inexistente")

    if persona.rol != "ARBITRO":
        raise ValueError("La persona no tiene rol de árbitro")
