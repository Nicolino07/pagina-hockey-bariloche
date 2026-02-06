from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.fichaje_rol import FichajeRol
from app.models.persona_rol import PersonaRol 
from app.core.exceptions  import ValidationError, NotFoundError


def crear_fichaje(
    *,
    db: Session,
    id_persona: int,
    id_club: int,
    rol,
    fecha_inicio: date,
    creado_por: str | None,
) -> FichajeRol:

    # 1️⃣ Buscar persona_rol válido
    persona_rol = db.scalar(
        select(PersonaRol).where(
            PersonaRol.id_persona == id_persona,
            PersonaRol.rol == rol,
            PersonaRol.fecha_hasta.is_(None),
        )
    )

    if not persona_rol:
        raise ValidationError(
            f"La persona no tiene asignado el rol {rol}"
        )

    # 2️⃣ Evitar fichaje activo duplicado
    existe = db.scalar(
        select(FichajeRol).where(
            FichajeRol.id_persona_rol == persona_rol.id_persona_rol,
            FichajeRol.id_club == id_club,
            FichajeRol.activo == True,
            FichajeRol.fecha_fin.is_(None),
            FichajeRol.borrado_en.is_(None),
        )
    )

    if existe:
        raise ValidationError(
            "La persona ya tiene un fichaje activo para ese rol en el club"
        )

    # 3️⃣ Crear fichaje (🔥 ahora sí completo)
    fichaje = FichajeRol(
        id_persona=id_persona,
        id_club=id_club,
        id_persona_rol=persona_rol.id_persona_rol,  # 🔑 CLAVE
        rol=rol,
        fecha_inicio=fecha_inicio,
        activo=True,
        creado_por=creado_por,
    )

    db.add(fichaje)
    db.flush()

    return fichaje



def dar_baja_fichaje(
    *,
    db: Session,
    id_fichaje_rol: int,
    fecha_fin: date,
    actualizado_por: str | None,
) -> FichajeRol:

    fichaje = db.get(FichajeRol, id_fichaje_rol)

    if not fichaje or fichaje.borrado_en is not None:
        raise NotFoundError("Fichaje no encontrado")

    if not fichaje.activo:
        raise ValidationError("El fichaje ya está dado de baja")
    
    if fichaje.fecha_fin is not None:
        raise ValidationError("El fichaje ya tiene fecha de fin")


    fichaje.fecha_fin = fecha_fin
    fichaje.activo = False
    fichaje.actualizado_por = actualizado_por

    fichaje.activo = False
    db.commit() # <--- Esto DEBE ir antes del return
    return {"message": "Baja exitosa"}


def obtener_fichajes_por_club(
    *,
    db: Session,
    id_club: int,
    solo_activos: bool = True,
):
    query = select(FichajeRol).where(
        FichajeRol.id_club == id_club,
        FichajeRol.borrado_en.is_(None),
    )

    if solo_activos:
        query = query.where(
            FichajeRol.activo == True,
            FichajeRol.fecha_fin.is_(None),
        )

    return db.scalars(query).all()
