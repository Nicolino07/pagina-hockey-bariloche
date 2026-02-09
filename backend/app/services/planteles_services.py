# backend/app/services/planteles_services.py
from datetime import date, datetime
from app.schemas.plantel import PlantelCreate
from sqlalchemy.exc import DBAPIError
from sqlalchemy.orm import Session

from app.models.equipo import Equipo
from app.models.persona import Persona
from app.models.plantel import Plantel
from app.models.fichaje_rol import FichajeRol
from app.models.plantel_integrante import PlantelIntegrante
from app.schemas.plantel_integrante import PlantelIntegranteCreate
from app.models.persona_rol import PersonaRol
from app.core.exceptions import (
    NotFoundError,
    ConflictError,
    ValidationError,
)

def crear_plantel(
    *,
    db: Session,
    data: PlantelCreate,
    current_user,
) -> Plantel:

    # ❌ no permitir más de un plantel activo por equipo
    existente = (
        db.query(Plantel)
        .filter(
            Plantel.id_equipo == data.id_equipo,
            Plantel.activo.is_(True),
            Plantel.borrado_en.is_(None),
        )
        .first()
    )

    if existente:
        raise ConflictError(
            "Ya existe un plantel activo para ese equipo"
        )

    plantel = Plantel(
        id_equipo=data.id_equipo,
        nombre=data.nombre,
        temporada=data.temporada,
        descripcion=data.descripcion,
        fecha_apertura=data.fecha_apertura or date.today(),
        fecha_cierre=data.fecha_cierre,
        activo=data.activo,
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
    """
    Agrega un integrante al plantel.
    REQUISITO: La persona debe estar previamente fichada en el club.
    """

    # ============================================
    # 1️⃣ VALIDAR PLANTEL
    # ============================================
    id_plantel = data.id_plantel
    plantel = db.get(Plantel, id_plantel)

    if not plantel:
        raise NotFoundError("Plantel no encontrado")

    if plantel.borrado_en is not None:
        raise ValidationError("No se puede modificar un plantel eliminado")

    # ============================================
    # 2️⃣ OBTENER ID_CLUB DEL PLANTEL
    # ============================================
    id_club = (
        db.query(Equipo.id_club)
        .join(Plantel, Plantel.id_equipo == Equipo.id_equipo)
        .filter(Plantel.id_plantel == id_plantel)
        .scalar()
    )

    if not id_club:
        raise ValidationError("No se pudo obtener el club del plantel")

    # ============================================
    # 3️⃣ VALIDAR QUE EXISTE FICHAJE ACTIVO
    # ============================================
    fichaje = (
        db.query(FichajeRol)
        .filter(
            FichajeRol.id_persona == data.id_persona,
            FichajeRol.id_club == id_club,
            FichajeRol.rol == data.rol_en_plantel,
            FichajeRol.activo.is_(True),
            FichajeRol.fecha_fin.is_(None),
        )
        .first()
    )

    if not fichaje:
        raise ValidationError(
            f"La persona no está fichada en este club con el rol {data.rol_en_plantel}. "
            f"Debe ficharla primero antes de agregarla al plantel."
        )

    # ============================================
    # 4️⃣ VALIDACIONES DE NEGOCIO
    # ============================================
    validar_genero_para_jugador(
        db,
        id_plantel=id_plantel,
        id_persona=data.id_persona,
        rol_en_plantel=data.rol_en_plantel,
    )

    # ============================================
    # 5️⃣ VERIFICAR SI YA EXISTE EL INTEGRANTE
    # ============================================
    existente = (
        db.query(PlantelIntegrante)
        .filter(
            PlantelIntegrante.id_plantel == id_plantel,
            PlantelIntegrante.id_persona == data.id_persona,
            PlantelIntegrante.rol_en_plantel == data.rol_en_plantel,
        )
        .first()
    )

    # ============================================
    # 6️⃣ EXISTE Y ESTÁ ACTIVO
    # ============================================
    if existente and existente.fecha_baja is None:
        raise ConflictError(
            "La persona ya está activa en el plantel con ese rol"
        )

    # ============================================
    # 7️⃣ EXISTE PERO ESTÁ DE BAJA → RESTAURAR
    # ============================================
    if existente and existente.fecha_baja is not None:
        existente.fecha_baja = None
        existente.fecha_alta = date.today()
        existente.numero_camiseta = data.numero_camiseta
        existente.id_fichaje_rol = fichaje.id_fichaje_rol
        existente.actualizado_en = datetime.utcnow()
        existente.actualizado_por = current_user.username

        try:
            db.flush()
        except DBAPIError as e:
            db.rollback()
            mensaje = str(e.orig).lower() if e.orig else str(e).lower()

            if "rol" in mensaje and "otro club" in mensaje:
                raise ConflictError(
                    "La persona ya tiene ese rol activo en otro club"
                )

            raise ValidationError(
                "No se pudo restaurar el integrante del plantel"
            )

        return existente

    # ============================================
    # 8️⃣ NO EXISTE → CREAR NUEVO
    # ============================================
    integrante = PlantelIntegrante(
        id_plantel=id_plantel,
        id_persona=data.id_persona,
        id_fichaje_rol=fichaje.id_fichaje_rol,
        rol_en_plantel=data.rol_en_plantel,
        numero_camiseta=data.numero_camiseta,
        fecha_alta=date.today(),
        creado_por=current_user.username,
    )

    db.add(integrante)

    try:
        db.flush()
    except DBAPIError as e:
        db.rollback()
        mensaje = str(e.orig).lower() if e.orig else str(e).lower()

        if "rol" in mensaje and "otro club" in mensaje:
            raise ConflictError(
                "La persona ya tiene ese rol activo en otro club"
            )

        raise ValidationError(
            "No se pudo crear el integrante del plantel"
        )

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
