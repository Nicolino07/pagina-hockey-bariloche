# routes/torneos.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session 
from datetime import date

from app.database import get_db
from app.models.torneo import Torneo as TorneoModel
from app.schemas.torneo import (
    TorneoSchema, 
    TorneoCreate, 
    TorneoUpdate,
    TorneoFinalizar
)
from app.dependencies.permissions import require_admin
from app.models.usuario import Usuario
from app.services import torneos_services

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


# 🔐 ADMIN - Crear torneo
@router.post("/", response_model=TorneoSchema, status_code=status.HTTP_201_CREATED)
def crear_torneo(
    data: TorneoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    """Crea un nuevo torneo"""
    try:
        return torneos_services.crear_torneo(db, data, current_user)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# 🔐 ADMIN - Actualizar torneo
@router.put("/{id_torneo}", response_model=TorneoSchema)
def actualizar_torneo(
    id_torneo: int, 
    data: TorneoUpdate, 
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin)
):
    """Actualiza un torneo existente"""
    try:
        return torneos_services.actualizar_torneo(db, id_torneo, data, current_user)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# 🔐 ADMIN - Soft Delete
@router.delete("/{id_torneo}", status_code=status.HTTP_200_OK)
def eliminar_torneo_soft(
    id_torneo: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin)
):
    """Eliminación lógica (soft delete) de un torneo"""
    try:
        torneo = torneos_services.soft_delete_torneo(db, id_torneo, current_user)
        return {
            "detail": "Torneo eliminado correctamente",
            "id_torneo": torneo.id_torneo,
            "borrado_en": torneo.borrado_en
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# 🔐 ADMIN - Finalizar torneo
@router.post("/{id_torneo}/finalizar", response_model=TorneoSchema)
def finalizar_torneo(
    id_torneo: int,
    data: TorneoFinalizar = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin)
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


# 🔐 ADMIN - Restaurar torneo
@router.post("/{id_torneo}/restaurar", response_model=TorneoSchema)
def restaurar_torneo(
    id_torneo: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin)
):
    """Restaura un torneo previamente eliminado"""
    try:
        return torneos_services.restaurar_torneo(db, id_torneo, current_user)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# 🔐 ADMIN - Reabrir torneo (si se necesita)
@router.post("/{id_torneo}/reabrir", response_model=TorneoSchema)
def reabrir_torneo(
    id_torneo: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin)
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
        
        db.commit()
        db.refresh(torneo)
        return torneo
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# Opcional: Endpoint para eliminación física (solo desarrollo)
@router.delete("/{id_torneo}/fisico", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_torneo_fisico(
    id_torneo: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin)
):
    """Eliminación física del torneo (PELIGROSO - solo para desarrollo)"""
    torneo = db.query(TorneoModel).filter(TorneoModel.id_torneo == id_torneo).first()
    if not torneo:
        raise HTTPException(status_code=404, detail="Torneo no encontrado")
    
    # Verificar que no tenga dependencias
    if torneo.fases:
        raise HTTPException(
            status_code=400, 
            detail="No se puede eliminar físicamente un torneo con fases asociadas"
        )
    
    db.delete(torneo)
    db.commit()
    return None