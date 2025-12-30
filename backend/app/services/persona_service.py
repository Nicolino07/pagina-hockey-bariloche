from datetime import date
from sqlalchemy.orm import Session
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError

from app.models.persona import Persona
from app.models.persona_rol import PersonaRol
from app.schemas.persona import PersonaCreate
from app.schemas.persona_rol import PersonaRolCreate

ROLES_VALIDOS = {"jugador", "entrenador", "arbitro"}

def crear_persona_con_rol(
    db: Session,
    persona_data: PersonaCreate,
    rol_data: PersonaRolCreate
):
    if rol_data.rol not in ROLES_VALIDOS:
        raise HTTPException(
            status_code=400,
            detail=f"Rol inválido: {rol_data.rol}"
        )

    try:
        with db.begin():
            persona = Persona(**persona_data.dict())
            db.add(persona)
            db.flush()  # genera persona.id_persona

            persona_rol = PersonaRol(
                id_persona=persona.id_persona,
                rol=rol_data.rol,
                fecha_desde=rol_data.fecha_desde or date.today()
            )
            db.add(persona_rol)

        return persona

    except IntegrityError:
        raise HTTPException(
            status_code=409,
            detail="Ya existe una persona con ese DNI"
        )
