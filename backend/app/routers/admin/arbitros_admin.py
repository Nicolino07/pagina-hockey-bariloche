from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.arbitro import Arbitro
from app.schemas.arbitro import Arbitro, ArbitroCreate

router = APIRouter(prefix="/admin/arbitros", tags=["Árbitros Admin"])


@router.get("/", response_model=list[Arbitro])
def listar_arbitros(db: Session = Depends(get_db)):
    return db.query(Arbitro).all()


@router.get("/{id_arbitro}", response_model=Arbitro)
def obtener_arbitro(id_arbitro: int, db: Session = Depends(get_db)):
    a = db.query(Arbitro).filter(Arbitro.id_arbitro == id_arbitro).first()
    if not a:
        raise HTTPException(404, "Árbitro no encontrado")
    return a


@router.post("/", response_model=Arbitro, status_code=201)
def crear_arbitro(data: ArbitroCreate, db: Session = Depends(get_db)):
    nuevo = Arbitro(**data.dict())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.put("/{id_arbitro}", response_model=Arbitro)
def actualizar_arbitro(id_arbitro: int, data: ArbitroCreate, db: Session = Depends(get_db)):
    a = db.query(Arbitro).filter(Arbitro.id_arbitro == id_arbitro).first()
    if not a:
        raise HTTPException(404, "Árbitro no encontrado")

    for k, v in data.dict().items():
        setattr(a, k, v)

    db.commit()
    db.refresh(a)
    return a


@router.delete("/{id_arbitro}", status_code=204)
def eliminar_arbitro(id_arbitro: int, db: Session = Depends(get_db)):
    a = db.query(Arbitro).filter(Arbitro.id_arbitro == id_arbitro).first()
    if not a:
        raise HTTPException(404, "Árbitro no encontrado")

    db.delete(a)
    db.commit()
