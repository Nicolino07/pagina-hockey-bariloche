from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models.persona import Persona
from app.models.persona_rol import PersonaRol
from app.schemas.persona import PersonaCreate
from app.schemas.persona_rol import PersonaRolCreate
from app.core.exceptions import NotFoundError, ValidationError, ConflictError

ROLES_VALIDOS = {"jugador", "entrenador", "arbitro"}


def listar_personas(db: Session) -> list[Persona]:
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
    current_user,
) -> Persona:

    if rol_data.rol not in ROLES_VALIDOS:
        raise ValidationError(f"Rol inválido: {rol_data.rol}")

    try:
        persona = Persona(**persona_data.model_dump())
        persona.creado_por = current_user.username
        db.add(persona)
        db.flush()  # 🔥 genera persona.id_persona

        persona_rol = PersonaRol(
            id_persona=persona.id_persona,
            rol=rol_data.rol,
            fecha_desde=rol_data.fecha_desde or date.today(),
            creado_por=current_user.username,
        )
        db.add(persona_rol)

        # NO refresh necesario
        return persona

    except IntegrityError:
        # el rollback lo hace get_db()
        raise ConflictError("Ya existe una persona con ese DNI")


def actualizar_persona(
    db: Session,
    persona: Persona,
    data: PersonaCreate,
    current_user,
) -> Persona:
    valores = data.model_dump(exclude_unset=True)

    for campo, valor in valores.items():
        setattr(persona, campo, valor)

    persona.actualizado_por = current_user.username

    return persona


def eliminar_persona(db: Session, persona_id: int, current_user) -> None:
    persona = obtener_persona(db, persona_id)
    persona.soft_delete(usuario=current_user.username)


def restaurar_persona(db: Session, persona_id: int, current_user) -> Persona:
    persona = db.get(Persona, persona_id)
    if not persona:
        raise NotFoundError("Persona no encontrada")

    persona.restore(usuario=current_user.username)

    return persona
