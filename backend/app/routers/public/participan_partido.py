# routes/participaciones.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.participan_partido import ParticipanPartido as PPModel
from app.schemas.participan_partido import ParticipanPartido
from app.database import get_db

router = APIRouter(prefix="/public/participaciones", tags=["Participan Partido - Public"])

@router.get("/", response_model=list[ParticipanPartido])
def get_participaciones(db: Session = Depends(get_db)):
    return db.query(PPModel).all()

@router.get("/{id}", response_model=ParticipanPartido)
def get_participacion(id: int, db: Session = Depends(get_db)):
    item = db.query(PPModel).filter(PPModel.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    return item

