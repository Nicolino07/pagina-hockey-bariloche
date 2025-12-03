from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.entrenador import Entrenador
from app.schemas.entrenador import Entrenador, EntrenadorCreate

router = APIRouter(prefix="/admin/entrenadores", tags=["Entrenadores Admin"])


@router.get("/", response_model=list[Entrenador])
def listar_entrenadores(db: Session = Depends(get_db)):
    return db.query(Entrenador).all()


@router.get("/{id_entrenador}", response_model=Entrenador)
def obtener_entrenador(id_entrenador: int, db: Session = Depends(get_db)):
    e = db.query(Entrenador).filter(Entrenador.id_entrenador == id_entrenador).first()
    if not e:
        raise HTTPException(404, "Entrenador no encontrado")
    return e


@router.post("/", response_model=Entrenador, status_code=201)
def crear_entrenador(data: EntrenadorCreate, db: Session = Depends(get_db)):
    nuevo = Entrenador(**data.dict())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.put("/{id_entrenador}", response_model=Entrenador)
def actualizar_entrenador(id_entrenador: int, data: EntrenadorCreate, db: Session = Depends(get_db)):
    e = db.query(Entrenador).filter(Entrenador.id_entrenador == id_entrenador).first()
    if not e:
        raise HTTPException(404, "Entrenador no encontrado")

    for k, v in data.dict().items():
        setattr(e, k, v)

    db.commit()
    db.refresh(e)
    return e


@router.delete("/{id_entrenador}", status_code=204)
def eliminar_entrenador(id_entrenador: int, db: Session = Depends(get_db)):
    e = db.query(Entrenador).filter(Entrenador.id_entrenador == id_entrenador).first()
    if not e:
        raise HTTPException(404, "Entrenador no encontrado")

    db.delete(e)
    db.commit()
