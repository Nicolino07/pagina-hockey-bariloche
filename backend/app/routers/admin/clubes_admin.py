from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.club import Club as ClubSchema, ClubCreate
from app.models.club import Club


router = APIRouter(prefix="/admin/clubes", tags=["Clubes Admin"])

@router.get("/", response_model=list[ClubSchema])
def listar_clubes_admin(db: Session = Depends(get_db)):
    return db.query(Club).all()

@router.get("/{club_id}", response_model=ClubSchema)
def obtener_club_admin(club_id: int, db: Session = Depends(get_db)):
    club = db.query(Club).filter(Club.id_club == club_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Club no encontrado")
    return club

@router.post("/", response_model=ClubSchema)
def crear_club(club: ClubCreate, db: Session = Depends(get_db)):
    db_club = Club(**club.dict())
    db.add(db_club)
    db.commit()
    db.refresh(db_club)
    return db_club

@router.put("/{club_id}", response_model=ClubSchema)
def actualizar_club(club_id: int, club_data: ClubCreate, db: Session = Depends(get_db)):
    club = db.query(Club).filter(Club.id_club == club_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Club no encontrado")

    for key, value in club_data.dict().items():
        setattr(club, key, value)

    db.commit()
    db.refresh(club)
    return club

@router.delete("/{club_id}")
def eliminar_club(club_id: int, db: Session = Depends(get_db)):
    club = db.query(Club).filter(Club.id_club == club_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Club no encontrado")

    db.delete(club)
    db.commit()
    return {"detail": "Club eliminado"}

