from app.models.fichaje_rol import FichajeRol
from app.models.persona import Persona
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from datetime import date
from typing import List

from app.database import get_db
from app.schemas.fichaje_rol import (
    FichajeConPersona,
    FichajeRolCreate,
    FichajeRolRead,
    FichajeRolBaja,
)
from app.services import fichajes_services

router = APIRouter(
    prefix="/fichajes",
    tags=["Fichajes"],
)


@router.post(
    "",
    response_model=FichajeRolRead,
    status_code=status.HTTP_201_CREATED,
    summary="Crear fichaje",
)
def crear_fichaje(
    data: FichajeRolCreate,
    db: Session = Depends(get_db),
):
    return fichajes_services.crear_fichaje(
        db=db,
        id_persona=data.id_persona,
        id_club=data.id_club,
        rol=data.rol,
        fecha_inicio=data.fecha_inicio or date.today(),
        creado_por=data.creado_por,
    )


@router.patch(
    "/{id_fichaje_rol}/baja",
    response_model=FichajeRolRead,
    summary="Dar de baja un fichaje",
)
def dar_baja_fichaje(
    id_fichaje_rol: int,
    data: FichajeRolBaja,
    db: Session = Depends(get_db),
):
    return fichajes_services.dar_baja_fichaje(
        db=db,
        id_fichaje_rol=id_fichaje_rol,
        fecha_fin=data.fecha_fin,
        actualizado_por=data.actualizado_por,
    )



@router.get("/club/{id_club}", response_model=List[FichajeConPersona])
def get_fichajes_por_club(
    id_club: int, 
    solo_activos: bool = True, 
    db: Session = Depends(get_db)
):
    # Realizamos la consulta uniendo FichajeRol con Persona
    query = (
        db.query(
            FichajeRol.id_fichaje_rol,
            FichajeRol.id_persona,
            FichajeRol.rol,
            FichajeRol.fecha_inicio,
            FichajeRol.fecha_fin,
            FichajeRol.activo,
            Persona.nombre.label("persona_nombre"),
            Persona.apellido.label("persona_apellido")
        )
        .join(Persona, FichajeRol.id_persona == Persona.id_persona)
        .filter(FichajeRol.id_club == id_club)
    )

    if solo_activos:
        query = query.filter(FichajeRol.activo == True)

    results = query.all()
    
    # SQLAlchemy devuelve tuplas, FastAPI las convertirá al esquema FichajeConPersona
    return results