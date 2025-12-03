from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entrenador import Entrenador
from app.schemas.entrenador import Entrenador

router = APIRouter(prefix="/public/entrenadores", tags=["Entrenadores Público"])


@router.get("/", response_model=list[Entrenador])
def listar_entrenadores(db: Session = Depends(get_db)):
    return db.query(Entrenador).all()


@router.get("/{id_entrenador}", response_model=Entrenador)
def obtener_entrenador(id_entrenador: int, db: Session = Depends(get_db)):
    e = db.query(Entrenador).filter(Entrenador.id_entrenador == id_entrenador).first()
    if not e:
        raise HTTPException(404, "Entrenador no encontrado")
    return e

