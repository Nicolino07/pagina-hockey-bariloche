# backend/app/services/personas_services.py
from datetime import date
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select, text

from app.models.persona import Persona
from app.models.persona_rol import PersonaRol
from app.schemas.persona import PersonaCreate, PersonaUpdate
from app.schemas.persona_rol import PersonaRolCreate
from app.core.exceptions import NotFoundError, ValidationError, ConflictError
from app.models.plantel_integrante import PlantelIntegrante
from app.models.plantel import Plantel
from app.models.equipo import Equipo



# =========================
# Helpers
# =========================

def _get_persona(db: Session, persona_id: int) -> Persona:
    persona = db.get(Persona, persona_id)
    if not persona or persona.borrado_en is not None:
        raise NotFoundError("Persona no encontrada")
    return persona


# =========================
# Listar personas
# =========================

def listar_personas(db: Session):
    stmt = (
        select(Persona)
        .where(Persona.borrado_en.is_(None))
        .order_by(Persona.apellido, Persona.nombre)
    )
    return db.scalars(stmt).all()


# =========================
# Obtener persona
# =========================

def obtener_persona(db: Session, persona_id: int):
    return _get_persona(db, persona_id)


# =========================
# Crear persona + rol
# =========================

def crear_persona_con_rol(
    db: Session,
    persona_data: PersonaCreate,
    rol_data: PersonaRolCreate,
    current_user,
):
    persona = Persona(**persona_data.model_dump())
    persona.creado_por = current_user.username

    db.add(persona)
    db.flush()  # obtiene id_persona

    rol = PersonaRol(
        id_persona=persona.id_persona,
        rol=rol_data.rol,
        fecha_desde=rol_data.fecha_desde or date.today(),
        creado_por=current_user.username,
    )

    db.add(rol)
    db.commit()
    db.refresh(persona)

    return persona


# =========================
# Actualizar persona
# =========================

def actualizar_persona(
    db: Session,
    persona_id: int,
    data: PersonaUpdate,
    current_user,
):
    persona = _get_persona(db, persona_id)

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(persona, field, value)

    persona.actualizado_por = current_user.username
    db.commit()
    db.refresh(persona)

    return persona


# =========================
# Agregar rol
# =========================

def agregar_rol_a_persona(
    db: Session,
    persona_id: int,
    data: PersonaRolCreate,
    current_user,
):
    persona = _get_persona(db, persona_id)

    existe_activo = (
        db.query(PersonaRol)
        .filter(
            PersonaRol.id_persona == persona_id,
            PersonaRol.rol == data.rol,
            PersonaRol.fecha_hasta.is_(None),
        )
        .first()
    )

    if existe_activo:
        raise ValidationError("La persona ya tiene este rol activo")

    rol = PersonaRol(
        id_persona=persona_id,
        rol=data.rol,
        fecha_desde=data.fecha_desde or date.today(),
        creado_por=current_user.username,
    )

    db.add(rol)
    db.commit()
    db.refresh(rol)

    return rol


# =========================
# Cerrar rol
# =========================

def cerrar_rol(
    db: Session,
    persona_id: int,
    rol_id: int,
    current_user,
):
    rol = (
        db.query(PersonaRol)
        .filter(
            PersonaRol.id_persona_rol == rol_id,
            PersonaRol.id_persona == persona_id,
            PersonaRol.fecha_hasta.is_(None),
        )
        .first()
    )

    if not rol:
        raise NotFoundError("Rol activo no encontrado")

    rol.fecha_hasta = date.today()
    rol.actualizado_por = current_user.username

    db.commit()
    db.refresh(rol)

    return rol

# ======================================
# Obtener personas con roles activos
# ======================================

def obtener_personas_con_roles_activos(
    *,
    db: Session,
    id_club: int | None = None,
    id_persona: int | None = None,
):
    stmt = (
        select(Persona)
        # Rol activo
        .join(PersonaRol, PersonaRol.id_persona == Persona.id_persona)
        .filter(
            Persona.borrado_en.is_(None),
            PersonaRol.fecha_hasta.is_(None),
        )
    )

    # 🔹 Filtro por persona (opcional)
    if id_persona:
        stmt = stmt.filter(Persona.id_persona == id_persona)

    # 🔹 Filtro por club (opcional)
    if id_club:
        stmt = (
            stmt
            .join(
                PlantelIntegrante,
                PlantelIntegrante.id_persona == Persona.id_persona,
            )
            .join(
                Plantel,
                Plantel.id_plantel == PlantelIntegrante.id_plantel,
            )
            .join(
                Equipo,
                Equipo.id_equipo == Plantel.id_equipo,
            )
            .filter(
                Equipo.id_club == id_club,
                PlantelIntegrante.fecha_baja.is_(None),
                Plantel.borrado_en.is_(None),
            )
        )

    stmt = (
        stmt
        .options(
            selectinload(
                Persona.roles.and_(PersonaRol.fecha_hasta.is_(None))
            )
        )
        .order_by(Persona.apellido, Persona.nombre)
        .distinct()
    )

    return db.execute(stmt).scalars().all()


# =========================
# Eliminar persona (soft)
# =========================

def eliminar_persona(
    db: Session,
    persona_id: int,
    current_user,
):
    persona = _get_persona(db, persona_id)

    persona.borrado_en = date.today()
    persona.actualizado_por = current_user.username

    db.commit()


def listar_personas_roles_clubes(db: Session):
    return db.execute(
        text("SELECT * FROM v_personas_roles_clubes")
    ).mappings().all()
