from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models.persona import Persona
from app.models.persona_rol import PersonaRol
from app.schemas.persona import PersonaCreate
from app.schemas.persona_rol import PersonaRolCreate
from app.core.exceptions import NotFoundError, ValidationError, ConflictError

ROLES_VALIDOS = {"jugador", "entrenador", "arbitro"}


def listar_personas(db: Session):
    return (
        db.query(Persona)
        .order_by(Persona.apellido, Persona.nombre)
        .all()
    )


def obtener_persona(db: Session, persona_id: int) -> Persona:
    persona = db.get(Persona, persona_id)
    if not persona:
        raise NotFoundError("Persona no encontrada")

    return persona


def crear_persona_con_rol(
    db: Session,
    persona_data: PersonaCreate,
    rol_data: PersonaRolCreate,
) -> Persona:

    if rol_data.rol not in ROLES_VALIDOS:
        raise ValidationError(f"Rol inválido: {rol_data.rol}")

    try:
        with db.begin():
            persona = Persona(**persona_data.model_dump())
            db.add(persona)
            db.flush()  # genera persona.id_persona

            persona_rol = PersonaRol(
                id_persona=persona.id_persona,
                rol=rol_data.rol,
                fecha_desde=rol_data.fecha_desde or date.today(),
            )
            db.add(persona_rol)

        return persona

    except IntegrityError:
        raise ConflictError("Ya existe una persona con ese DNI")

def actualizar_persona(
    db: Session,
    persona: Persona,
    data: PersonaCreate
) -> Persona:
    valores = data.model_dump(exclude_unset=True)

    for campo, valor in valores.items():
        setattr(persona, campo, valor)

    db.commit()
    db.refresh(persona)
    return persona  

def eliminar_persona(db: Session, persona: Persona):
    db.delete(persona)
    db.commit() 
    return  
