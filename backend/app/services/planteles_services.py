from datetime import date
from sqlalchemy.orm import Session

from app.models.equipo import Equipo
from app.models.persona import Persona
from app.models.plantel import Plantel
from app.models.plantel_integrante import PlantelIntegrante
from app.schemas.plantel_integrante import PlantelIntegranteCreate
from app.models.persona_rol import PersonaRol
from app.core.exceptions import (
    NotFoundError,
    ConflictError,
    ValidationError,
)


def crear_plantel(
    db: Session,
    id_equipo: int,
    current_user,
) -> Plantel:

    existente = (
        db.query(Plantel)
        .filter(
            Plantel.id_equipo == id_equipo,
            Plantel.borrado_en.is_(None),
        )
        .first()
    )

    if existente:
        raise ConflictError(
            "Ya existe un plantel para ese equipo"
        )

    plantel = Plantel(
        id_equipo=id_equipo,
        creado_por=current_user.username,
    )

    db.add(plantel)
    db.flush()  # genera id_plantel

    return plantel


def crear_integrante(
    *,
    db: Session,
    data: PlantelIntegranteCreate,
    current_user,
) -> PlantelIntegrante:

    id_plantel = data.id_plantel

    plantel = db.get(Plantel, id_plantel)

    if not plantel:
        raise NotFoundError("Plantel no encontrado")

    if plantel.borrado_en is not None:
        raise ValidationError("No se puede modificar un plantel eliminado")

    # ✅ VALIDACIÓN DE GÉNERO/ROL (solo si es JUGADOR)
    validar_genero_para_jugador(
        db,
        id_plantel=id_plantel,
        id_persona=data.id_persona,
        rol_en_plantel=data.rol_en_plantel,
    )

    validar_rol_persona(
        db,
        id_persona=data.id_persona,
        rol_en_plantel=data.rol_en_plantel,
    )

    existente = (
        db.query(PlantelIntegrante)
        .filter(
            PlantelIntegrante.id_plantel == id_plantel,
            PlantelIntegrante.id_persona == data.id_persona,
            PlantelIntegrante.fecha_baja.is_(None),
        )
        .first()
    )

    if existente:
        raise ConflictError(
            "La persona ya está activa en el plantel con ese rol"
        )

    integrante = PlantelIntegrante(
        id_plantel=id_plantel,
        id_persona=data.id_persona,
        rol_en_plantel=data.rol_en_plantel,
        numero_camiseta=data.numero_camiseta,
        creado_por=current_user.username,
    )

    db.add(integrante)
    db.flush()  # 🔥 genera id_plantel_integrante

    return integrante



def validar_rol_persona(
    db: Session,
    *,
    id_persona: int,
    rol_en_plantel: str,
):
    rol_activo = (
        db.query(PersonaRol)
        .filter(
            PersonaRol.id_persona == id_persona,
            PersonaRol.rol == rol_en_plantel,
            PersonaRol.fecha_hasta.is_(None),
        )
        .first()
    )

    if not rol_activo:
        raise ValidationError(
            f"La persona no tiene habilitado el rol {rol_en_plantel}"
        )


def baja_integrante(
    db: Session,
    id_integrante: int,
    current_user,
) -> None:

    integrante = db.get(PlantelIntegrante, id_integrante)

    if not integrante:
        raise NotFoundError("Integrante no encontrado")

    if integrante.fecha_baja is not None:
        raise ValidationError("El integrante ya fue dado de baja")

    integrante.fecha_baja = date.today()
    integrante.actualizado_por = current_user.username


def obtener_plantel(
    db: Session,
    id_plantel: int,
) -> Plantel:

    plantel = db.get(Plantel, id_plantel)
    if not plantel:
        raise NotFoundError("Plantel no encontrado")

    return plantel

def obtener_plantel_activo_por_equipo(
    db: Session,
    id_equipo: int,
) -> Plantel | None:

    return (
        db.query(Plantel)
        .filter(
            Plantel.id_equipo == id_equipo,
            Plantel.activo.is_(True),
            Plantel.borrado_en.is_(None),
        )
        .first()
    )

def listar_integrantes_por_plantel(db: Session, id_plantel: int):
    return (
        db.query(PlantelIntegrante)
        .filter(
            PlantelIntegrante.id_plantel == id_plantel,
            PlantelIntegrante.fecha_baja.is_(None),
        )
        .all()
    )


def listar_integrantes_activos(
    db: Session,
    id_plantel: int,
):
    return (
        db.query(PlantelIntegrante)
        .filter(
            PlantelIntegrante.id_plantel == id_plantel,
            PlantelIntegrante.fecha_baja.is_(None),
        )
        .all()
    )


def soft_delete_plantel(
    db: Session,
    id_plantel: int,
    current_user,
) -> None:

    plantel = db.get(Plantel, id_plantel)
    if not plantel:
        raise NotFoundError("Plantel no encontrado")

    plantel.soft_delete(usuario=current_user.username)


def restore_plantel(
    db: Session,
    id_plantel: int,
    current_user,
) -> Plantel:

    plantel = db.get(Plantel, id_plantel)
    if not plantel:
        raise NotFoundError("Plantel no encontrado")

    plantel.restore(usuario=current_user.username)

    return plantel


def validar_genero_para_jugador(
    db: Session,
    *,
    id_plantel: int,
    id_persona: int,
    rol_en_plantel: str,
) -> None:
    # 🔓 Solo validamos si es JUGADOR
    if rol_en_plantel != "JUGADOR":
        return

    genero_equipo = (
        db.query(Equipo.genero)
        .join(Plantel, Plantel.id_equipo == Equipo.id_equipo)
        .filter(Plantel.id_plantel == id_plantel)
        .scalar()
    )

    if genero_equipo is None:
        raise ValidationError("No se pudo determinar el género del equipo")

    genero_persona = (
        db.query(Persona.genero)
        .filter(Persona.id_persona == id_persona)
        .scalar()
    )

    if genero_persona is None:
        raise ValidationError("No se pudo determinar el género de la persona")

    if genero_equipo != genero_persona:
        raise ValidationError(
            "El género de la persona no coincide con el del equipo"
        )
