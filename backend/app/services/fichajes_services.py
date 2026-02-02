from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.fichaje_rol import FichajeRol
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

    # Validar que no exista fichaje activo duplicado
    existe = db.scalar(
        select(FichajeRol)
        .where(
            FichajeRol.id_persona == id_persona,
            FichajeRol.id_club == id_club,
            FichajeRol.rol == rol,
            FichajeRol.activo == True,
            FichajeRol.fecha_fin.is_(None),
            FichajeRol.borrado_en.is_(None),
        )
    )

    if existe:
        raise ValidationError("La persona ya tiene un fichaje activo para ese rol en el club")

    fichaje = FichajeRol(
        id_persona=id_persona,
        id_club=id_club,
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

    fichaje.fecha_fin = fecha_fin
    fichaje.activo = False
    fichaje.actualizado_por = actualizado_por

    return fichaje


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
