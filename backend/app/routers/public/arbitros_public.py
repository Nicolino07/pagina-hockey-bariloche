from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.arbitro import Arbitro
from app.schemas.arbitro import Arbitro

router = APIRouter(prefix="/public/arbitros", tags=["Árbitros Público"])


@router.get("/", response_model=list[Arbitro])
def listar_arbitros(db: Session = Depends(get_db)):
    return db.query(Arbitro).all()


@router.get("/{id_arbitro}", response_model=Arbitro)
def obtener_arbitro(id_arbitro: int, db: Session = Depends(get_db)):
    a = db.query(Arbitro).filter(Arbitro.id_arbitro == id_arbitro).first()
    if not a:
        raise HTTPException(404, "Árbitro no encontrado")
    return a


