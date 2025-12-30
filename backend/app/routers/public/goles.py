# routes/goles.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.gol import Gol as GolModel
from app.schemas.gol import Gol

router = APIRouter(prefix="/public/goles", tags=["Goles - Public"])

@router.get("/", response_model=list[Gol])
def get_goles(db: Session = Depends(get_db)):
    return db.query(GolModel).all()

@router.get("/{id_gol}", response_model=Gol)
def get_gol(id_gol: int, db: Session = Depends(get_db)):
    gol = db.query(GolModel).filter(GolModel.id_gol == id_gol).first()
    if not gol:
        raise HTTPException(status_code=404, detail="Gol no encontrado")
    return gol

