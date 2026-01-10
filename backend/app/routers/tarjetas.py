# routes/tarjetas.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.tarjeta import Tarjeta as TarjetaModel
from app.schemas.tarjeta import Tarjeta, TarjetaCreate

router = APIRouter(prefix="/tarjetas", tags=["Tarjetas"])

@router.get("/", response_model=list[Tarjeta])
def get_tarjetas(db: Session = Depends(get_db)):
    return db.query(TarjetaModel).all()

@router.get("/{id_tarjeta}", response_model=Tarjeta)
def get_tarjeta(id_tarjeta: int, db: Session = Depends(get_db)):
    item = db.query(TarjetaModel).filter(TarjetaModel.id_tarjeta == id_tarjeta).first()
    if not item:
        raise HTTPException(status_code=404, detail="Tarjeta no encontrada")
    return item

@router.post("/", response_model=Tarjeta)
def create_tarjeta(data: TarjetaCreate, db: Session = Depends(get_db)):
    nuevo = TarjetaModel(**data.dict())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@router.put("/{id_tarjeta}", response_model=Tarjeta)
def update_tarjeta(id_tarjeta: int, data: TarjetaCreate, db: Session = Depends(get_db)):
    item = db.query(TarjetaModel).filter(TarjetaModel.id_tarjeta == id_tarjeta).first()
    if not item:
        raise HTTPException(status_code=404, detail="Tarjeta no encontrada")

    for key, value in data.dict().items():
        setattr(item, key, value)

    db.commit()
    db.refresh(item)
    return item

@router.delete("/{id_tarjeta}")
def delete_tarjeta(id_tarjeta: int, db: Session = Depends(get_db)):
    item = db.query(TarjetaModel).filter(TarjetaModel.id_tarjeta == id_tarjeta).first()
    if not item:
        raise HTTPException(status_code=404, detail="Tarjeta no encontrada")

    db.delete(item)
    db.commit()
    return {"detail": "Tarjeta eliminada"}
