from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.models.jugador import Jugador as JugadorDB
from app.schemas.jugador import Jugador, JugadorCreate, JugadorUpdate

router = APIRouter(prefix="/admin/jugadores", tags=["Jugadores Admin"])


@router.get("/", response_model=list[Jugador])
def listar_jugadores(
    nombre: str | None = None,
    apellido: str | None = None,
    dni: str | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(JugadorDB)

    if nombre:
        query = query.filter(JugadorDB.nombre.ilike(f"%{nombre}%"))
    if apellido:
        query = query.filter(JugadorDB.apellido.ilike(f"%{apellido}%"))
    if dni:
        query = query.filter(JugadorDB.dni == dni)

    return query.all()



@router.get("/{id_jugador}", response_model=Jugador)
def obtener_jugador(id_jugador: int, db: Session = Depends(get_db)):
    jugador = db.query(JugadorDB).filter(JugadorDB.id_jugador == id_jugador).first()
    if not jugador:
        raise HTTPException(404, "Jugador no encontrado")
    return jugador


@router.post("/", response_model=Jugador, status_code=201)
def crear_jugador(jugador: JugadorCreate, db: Session = Depends(get_db)):
    nuevo = JugadorDB(**jugador.dict())
    db.add(nuevo)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Ya existe un jugador con ese DNI"
        )

    db.refresh(nuevo)
    return nuevo


@router.put("/{id_jugador}", response_model=Jugador)
def actualizar_jugador(id_jugador: int, datos: JugadorUpdate, db: Session = Depends(get_db)):
    jugador = db.query(JugadorDB).filter(JugadorDB.id_jugador == id_jugador).first()
    if not jugador:
        raise HTTPException(404, "Jugador no encontrado")

    for k, v in datos.dict(exclude_unset=True).items():
        setattr(jugador, k, v)

    db.commit()
    db.refresh(jugador)
    return jugador


@router.delete("/{id_jugador}", status_code=204)
def eliminar_jugador(id_jugador: int, db: Session = Depends(get_db)):
    jugador = db.query(JugadorDB).filter(JugadorDB.id_jugador == id_jugador).first()
    if not jugador:
        raise HTTPException(404, "Jugador no encontrado")

    db.delete(jugador)
    db.commit()
