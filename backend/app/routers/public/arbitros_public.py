from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db

from app.models.arbitro import Arbitro as ArbitroModel
from app.schemas.arbitro import Arbitro as ArbitroSchema

router = APIRouter(prefix="/public/arbitros", tags=["Árbitros Público"])


@router.get("/", response_model=list[ArbitroSchema])
def listar_arbitros(db: Session = Depends(get_db)):
    return db.query(ArbitroModel).all()


@router.get("/{id_arbitro}", response_model=ArbitroSchema)
def obtener_arbitro(id_arbitro: int, db: Session = Depends(get_db)):
    a = db.query(ArbitroModel).filter(ArbitroModel.id_arbitro == id_arbitro).first()
    if not a:
        raise HTTPException(404, "Árbitro no encontrado")
    return a
