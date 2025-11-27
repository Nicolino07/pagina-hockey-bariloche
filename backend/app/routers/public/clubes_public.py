from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.club import Club as ClubSchema
from app.models.club import Club

router = APIRouter(prefix="/public/clubes", tags=["Clubes Público"])

@router.get("/", response_model=list[ClubSchema])
def listar_clubes_public(db: Session = Depends(get_db)):
    return db.query(Club).all()

@router.get("/{club_id}", response_model=ClubSchema)
def obtener_club_public(club_id: int, db: Session = Depends(get_db)):
    club = db.query(Club).filter(Club.id_club == club_id).first()
    if not club:
        raise HTTPException(status_code=404, detail="Club no encontrado")
    return club
