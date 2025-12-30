# routes/fases.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.fase import Fase as FaseModel
from app.schemas.fase import Fase

router = APIRouter(prefix="/public/fases", tags=["Fases - Public"])

@router.get("/", response_model=list[Fase])
def get_fases(db: Session = Depends(get_db)):
    return db.query(FaseModel).all()

@router.get("/{id_fase}", response_model=Fase)
def get_fase(id_fase: int, db: Session = Depends(get_db)):
    fase = db.query(FaseModel).filter(FaseModel.id_fase == id_fase).first()
    if not fase:
        raise HTTPException(status_code=404, detail="Fase no encontrada")
    return fase

