# routes/tarjetas.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.tarjeta import Tarjeta as TarjetaModel
from app.schemas.tarjeta import Tarjeta

router = APIRouter(prefix="/public/tarjetas", tags=["Tarjetas Público"])

@router.get("/", response_model=list[Tarjeta])
def get_tarjetas(db: Session = Depends(get_db)):
    return db.query(TarjetaModel).all()

@router.get("/{id_tarjeta}", response_model=Tarjeta)
def get_tarjeta(id_tarjeta: int, db: Session = Depends(get_db)):
    item = db.query(TarjetaModel).filter(TarjetaModel.id_tarjeta == id_tarjeta).first()
    if not item:
        raise HTTPException(status_code=404, detail="Tarjeta no encontrada")
    return item

