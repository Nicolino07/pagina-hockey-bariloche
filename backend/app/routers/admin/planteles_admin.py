from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
import datetime 

from app.models.plantel import Plantel, PlantelIntegrante
from app.models.plantel import Plantel, PlantelIntegrante
from app.schemas.plantel import (
    PlantelResponse, PlantelCreate,
    PlantelIntegranteCreate,
    PlantelIntegranteResponse
)


router = APIRouter(prefix="/admin/plantel", tags=["Plantel Admin"])


# ============================
#  PLANTELES
# ============================

@router.post("/", response_model=PlantelResponse)
def crear_plantel(data: PlantelCreate, db: Session = Depends(get_db)):

    plantel = Plantel(
        id_equipo=data.id_equipo,
        temporada=data.temporada
    )

    db.add(plantel)
    db.commit()
    db.refresh(plantel)

    return plantel


@router.get("/", response_model=list[PlantelResponse])
def listar_planteles(db: Session = Depends(get_db)):
    return db.query(Plantel).all()


# ============================
#  INTEGRANTES DEL PLANTEL
# ============================

@router.post("/integrante", response_model=PlantelIntegranteResponse)
def agregar_integrante(data: PlantelIntegranteCreate, db: Session = Depends(get_db)):

    # Validación lógico: uno u otro
    if (data.id_jugador is None and data.id_entrenador is None) or \
       (data.id_jugador is not None and data.id_entrenador is not None):
        raise HTTPException(
            status_code=400,
            detail="Debe especificar solo jugador O entrenador"
        )

    integrante = PlantelIntegrante(
        id_plantel=data.id_plantel,
        id_jugador=data.id_jugador,
        id_entrenador=data.id_entrenador,
        rol=data.rol,
        numero_camiseta=data.numero_camiseta,
        fecha_baja=data.fecha_baja
    )

    try:
        db.add(integrante)
        db.commit()
        db.refresh(integrante)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

    return integrante


@router.get("/{id_plantel}/integrantes", response_model=list[PlantelIntegranteResponse])
def listar_integrantes(id_plantel: int, db: Session = Depends(get_db)):
    return (
        db.query(PlantelIntegrante)
        .filter(PlantelIntegrante.id_plantel == id_plantel)
        .all()
    )


@router.put("/integrante/{id_integrante}/baja")
def dar_baja_integrante(id_integrante: int, db: Session = Depends(get_db)):
    integrante = db.query(PlantelIntegrante).filter(
        PlantelIntegrante.id_plantel_integrante == id_integrante
    ).first()

    if not integrante:
        raise HTTPException(404, "Integrante no encontrado")

    integrante.fecha_baja = datetime.date.today()

    db.commit()
    return {"message": "Integrante dado de baja"}
