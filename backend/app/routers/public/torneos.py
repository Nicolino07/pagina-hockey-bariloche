# routes/torneos.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.torneo import Torneo as TorneoModel
from app.schemas.torneo import Torneo

router = APIRouter(prefix="/public/torneos", tags=["Torneos Público"])

@router.get("/", response_model=list[Torneo])
def get_torneos(db: Session = Depends(get_db)):
    return db.query(TorneoModel).all()

@router.get("/{id_torneo}", response_model=Torneo)
def get_torneo(id_torneo: int, db: Session = Depends(get_db)):
    torneo = db.query(TorneoModel).filter(TorneoModel.id_torneo == id_torneo).first()
    if not torneo:
        raise HTTPException(status_code=404, detail="Torneo no encontrado")
    return torneo
