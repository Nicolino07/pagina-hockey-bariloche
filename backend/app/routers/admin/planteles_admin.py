from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.schemas.plantel import (
    PlantelCreate, PlantelResponse,
    PlantelIntegranteCreate, PlantelIntegranteResponse
)
from app.services.planteles_services import (
    agregar_integrante_a_plantel,
    obtener_integrantes_plantel,
    eliminar_integrante_plantel
)
from app.models.plantel import Plantel

router = APIRouter(prefix="/admin/plantel", tags=["plantel admin"])

# ======================
# Endpoints para PlantelIntegrante
# ======================

@router.post("/integrante", response_model=PlantelIntegranteResponse)
def agregar_integrante(
    integrante_data: PlantelIntegranteCreate,
    db: Session = Depends(get_db)
):
    """
    Agrega un nuevo integrante (jugador o entrenador) a un plantel
    """
    return agregar_integrante_a_plantel(
        db=db,
        id_plantel= integrante_data.id_plantel,
        id_jugador= integrante_data.id_jugador,
        id_entrenador= integrante_data.id_entrenador,
        rol=integrante_data.rol,
        numero_camiseta=integrante_data.numero_camiseta
    )

@router.get("/{id_plantel}/integrantes", response_model=List[PlantelIntegranteResponse])
def listar_integrantes(
    id_plantel: int,
    db: Session = Depends(get_db)
):
    """
    Lista todos los integrantes de un plantel específico
    """
    return obtener_integrantes_plantel(db, id_plantel)

@router.delete("/integrante/{id_plantel_integrante}")
def eliminar_integrante(
    id_plantel_integrante: int,
    db: Session = Depends(get_db)
):
    """
    Elimina un integrante de un plantel
    """
    return eliminar_integrante_plantel(db, id_plantel_integrante)

# ======================
# Endpoints para Plantel (si los necesitas)
# ======================

@router.post("/", response_model=PlantelResponse)
def crear_plantel(
    plantel_data: PlantelCreate,
    db: Session = Depends(get_db)
):
    """
    Crea un nuevo plantel
    """
    nuevo_plantel = Plantel(
        id_equipo=plantel_data.id_equipo,
        temporada=plantel_data.temporada
    )
    
    try:
        db.add(nuevo_plantel)
        db.commit()
        db.refresh(nuevo_plantel)
        return nuevo_plantel
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{id_plantel}", response_model=PlantelResponse)
def obtener_plantel(
    id_plantel: int,
    db: Session = Depends(get_db)
):
    """
    Obtiene un plantel por ID
    """
    plantel = db.query(Plantel).filter(Plantel.id_plantel == id_plantel).first()
    if not plantel:
        raise HTTPException(status_code=404, detail="Plantel no encontrado")
    return plantel