# routes/torneos.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date

from app.database import get_db
from app.schemas.torneo import (
    TorneoSchema, 
    TorneoCreate, 
    TorneoUpdate,
    TorneoFinalizar
)
from app.dependencies.permissions import require_superuser
from app.models.usuario import Usuario
from app.services import torneos_services, planteles_services

router = APIRouter(prefix="/torneos", tags=["Torneos"])


# 🔓 Público - Listar torneos con filtros
@router.get("/", response_model=list[TorneoSchema])
def listar_torneos(
    db: Session = Depends(get_db),
    solo_activos: bool = Query(True, description="Mostrar solo torneos activos"),
    incluir_eliminados: bool = Query(False, description="Incluir torneos eliminados")
):
    """Lista torneos con opciones de filtrado"""
    return torneos_services.listar_torneos(
        db, 
        solo_activos=solo_activos,
        incluir_eliminados=incluir_eliminados
    )


# 🔓 Público - Obtener torneo específico
@router.get("/{id_torneo}", response_model=TorneoSchema)
def obtener_torneo(id_torneo: int, db: Session = Depends(get_db)):
    """Obtiene un torneo por ID"""
    try:
        return torneos_services.obtener_torneo_activo(db, id_torneo)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


# 🔐 SUPERUSUARIO - Crear torneo
@router.post("/", response_model=TorneoSchema, status_code=status.HTTP_201_CREATED)
def crear_torneo(
    data: TorneoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_superuser),
):
    """Crea un nuevo torneo"""
    try:
        return torneos_services.crear_torneo(db, data, current_user)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# 🔐 SUPERUSUARIO - Actualizar torneo
@router.put("/{id_torneo}", response_model=TorneoSchema)
def actualizar_torneo(
    id_torneo: int, 
    data: TorneoUpdate, 
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_superuser)
):
    """Actualiza un torneo existente"""
    try:
        return torneos_services.actualizar_torneo(db, id_torneo, data, current_user)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# 🔐 SUPERUSUARIO - Preview del radio de impacto de una eliminación
@router.get("/{id_torneo}/impacto-eliminacion")
def impacto_eliminacion_torneo(
    id_torneo: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_superuser)
):
    """Cuenta qué se borraría si se elimina el torneo (no borra nada).

    Pensado para mostrar la confirmación antes de un borrado definitivo.
    """
    try:
        return torneos_services.calcular_impacto_eliminacion(db, id_torneo)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# 🔐 SUPERUSUARIO - Eliminación DEFINITIVA (borrado físico con cascada)
@router.delete("/{id_torneo}", status_code=status.HTTP_200_OK)
def eliminar_torneo(
    id_torneo: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_superuser)
):
    """Elimina el torneo de forma DEFINITIVA junto con todos sus datos.

    Solo para datos mal cargados o descartados. Los torneos reales se finalizan,
    no se borran. Un torneo finalizado debe reabrirse antes de poder eliminarse.
    """
    try:
        impacto = torneos_services.eliminar_torneo_definitivo(
            db, id_torneo, current_user
        )
        return {
            "detail": "Torneo eliminado definitivamente",
            "impacto": impacto,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# 🔐 SUPERUSUARIO - Finalizar torneo
@router.post("/{id_torneo}/finalizar", response_model=TorneoSchema)
def finalizar_torneo(
    id_torneo: int,
    data: TorneoFinalizar = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_superuser)
):
    """Finaliza un torneo (marca como inactivo)"""
    try:
        fecha_fin = data.fecha_fin if data else None
        return torneos_services.finalizar_torneo(
            db, id_torneo, current_user, fecha_fin
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# 🔐 SUPERUSUARIO - Reabrir torneo (si se necesita)
@router.post("/{id_torneo}/reabrir", response_model=TorneoSchema)
def reabrir_torneo(
    id_torneo: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_superuser)
):
    """Reabre un torneo finalizado (lo marca como activo)"""
    try:
        torneo = torneos_services.obtener_torneo_activo(db, id_torneo)
        
        if torneo.activo:
            raise HTTPException(
                status_code=400, 
                detail="El torneo ya está activo"
            )
        
        torneo.activo = True
        torneo.actualizado_en = func.now()
        torneo.actualizado_por = current_user.username

        # Simétrico a finalizar: si el torneo vuelve a estar activo, sus
        # nóminas vuelven a ser editables.
        planteles_services.reabrir_planteles_de_torneo(db, id_torneo, current_user)

        db.commit()
        db.refresh(torneo)
        return torneo
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))