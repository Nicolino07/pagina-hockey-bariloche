from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.jugador import Jugador
from app.schemas.jugador import Jugador, JugadorCreate

router = APIRouter(prefix="/admin/jugadores", tags=["Jugadores Admin"])


@router.get("/", response_model=list[Jugador])
def listar_jugadores(db: Session = Depends(get_db)):
    return db.query(Jugador).all()


@router.get("/{id_jugador}", response_model=Jugador)
def obtener_jugador(id_jugador: int, db: Session = Depends(get_db)):
    jugador = db.query(Jugador).filter(Jugador.id_jugador == id_jugador).first()
    if not jugador:
        raise HTTPException(404, "Jugador no encontrado")
    return jugador


@router.post("/", response_model=Jugador, status_code=201)
def crear_jugador(jugador: JugadorCreate, db: Session = Depends(get_db)):
    nuevo = Jugador(**jugador.dict())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.put("/{id_jugador}", response_model=Jugador)
def actualizar_jugador(id_jugador: int, datos: JugadorCreate, db: Session = Depends(get_db)):
    jugador = db.query(Jugador).filter(Jugador.id_jugador == id_jugador).first()
    if not jugador:
        raise HTTPException(404, "Jugador no encontrado")

    for k, v in datos.dict().items():
        setattr(jugador, k, v)

    db.commit()
    db.refresh(jugador)
    return jugador


@router.delete("/{id_jugador}", status_code=204)
def eliminar_jugador(id_jugador: int, db: Session = Depends(get_db)):
    jugador = db.query(Jugador).filter(Jugador.id_jugador == id_jugador).first()
    if not jugador:
        raise HTTPException(404, "Jugador no encontrado")

    db.delete(jugador)
    db.commit()
