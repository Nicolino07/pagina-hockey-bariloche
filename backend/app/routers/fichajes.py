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



@router.get(
    "/club/{id_club}/rol/{rol}/activos",
    response_model=list[FichajeRolRead],
)
def obtener_fichajes_activos_por_club_y_rol(
    id_club: int,
    rol: str,
    db: Session = Depends(get_db),
):
    """
    Devuelve personas fichadas activamente en un club con un rol específico.
    """
    return (
        db.query(FichajeRol)
        .filter(
            FichajeRol.id_club == id_club,
            FichajeRol.rol == rol,
            FichajeRol.activo.is_(True),
            FichajeRol.fecha_fin.is_(None),
        )
        .all()
    )



@router.get(
    "/club/{id_club}",
    response_model=List[FichajeConPersona],
    summary="Obtener fichajes de un club",
)
def obtener_fichajes_por_club(
    id_club: int,
    solo_activos: bool = True,
    db: Session = Depends(get_db),
):
    """
    Devuelve todos los fichajes de un club.
    Si solo_activos=True, solo devuelve fichajes sin fecha_fin.
    """
    query = (
        db.query(FichajeRol)
        .join(Persona, FichajeRol.id_persona == Persona.id_persona)
        .filter(FichajeRol.id_club == id_club)
    )
    
    if solo_activos:
        query = query.filter(
            FichajeRol.activo.is_(True),
            FichajeRol.fecha_fin.is_(None)
        )
    
    fichajes = query.all()
    
    # Construir respuesta con datos de persona
    resultado = []
    for fichaje in fichajes:
        persona = db.get(Persona, fichaje.id_persona)
        resultado.append({
            "id_fichaje_rol": fichaje.id_fichaje_rol,
            "id_persona": fichaje.id_persona,
            "id_club": fichaje.id_club,
            "id_persona_rol": fichaje.id_persona_rol,
            "rol": fichaje.rol,
            "fecha_inicio": fichaje.fecha_inicio,
            "fecha_fin": fichaje.fecha_fin,
            "activo": fichaje.activo,
            "persona_nombre": persona.nombre,
            "persona_apellido": persona.apellido,
            "persona_documento": persona.documento,
            "persona_genero": persona.genero,
            "persona_nacimiento": persona.fecha_nacimiento,
        })
    
    return resultado