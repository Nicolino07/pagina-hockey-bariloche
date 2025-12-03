# routes/planteles.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.plantel_equipo import PlantelEquipo as PlantelModel
from app.schemas.plantel_equipo import PlantelEquipo 

router = APIRouter(prefix="/public/planteles", tags=["Planteles Equipo Público"])

@router.get("/", response_model=list[PlantelEquipo])
def get_planteles(db: Session = Depends(get_db)):
    return db.query(PlantelModel).all()

@router.get("/{id}", response_model=PlantelEquipo)
def get_plantel(id: int, db: Session = Depends(get_db)):
    p = db.query(PlantelModel).filter(PlantelModel.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Plantel no encontrado")
    return p

