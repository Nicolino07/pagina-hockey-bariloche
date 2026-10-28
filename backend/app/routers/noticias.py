"""
Rutas para la gestión de noticias del sitio.
- Lectura: acceso público (solo noticias no eliminadas).
- Creación y actualización: rol ADMIN o superior.
- Eliminación (soft delete): rol ADMIN o superior.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import httpx
from bs4 import BeautifulSoup
from pydantic import BaseModel

from app.database import get_db
from app.models.noticia import Noticia
from app.schemas.noticia import NoticiaCreate, NoticiaOut, NoticiaUpdate, PreviewUrlOut
from app.dependencies.permissions import require_admin

router = APIRouter(prefix="/noticias", tags=["Noticias"])

# --- RUTAS PÚBLICAS (Para el Home) ---

@router.get("/", response_model=List[NoticiaOut])
def obtener_noticias_publicas(limit: int = 5, db: Session = Depends(get_db)):
    """
    Obtiene las últimas noticias para el Home. 
    Solo devuelve las que no han sido borradas.
    """
    noticias = db.query(Noticia)\
        .filter(Noticia.borrado_en == None)\
        .order_by(Noticia.creado_en.desc())\
        .limit(limit)\
        .all()
    return noticias

@router.get("/{id_noticia}", response_model=NoticiaOut)
def obtener_detalle_noticia(id_noticia: int, db: Session = Depends(get_db)):
    """ Obtiene una noticia específica por su ID """
    noticia = db.query(Noticia).filter(Noticia.id_noticia == id_noticia, Noticia.borrado_en == None).first()
    if not noticia:
        raise HTTPException(status_code=404, detail="Noticia no encontrada")
    return noticia


# --- PREVIEW DE URL EXTERNA ---

class PreviewUrlRequest(BaseModel):
    url: str

@router.post("/preview-url", response_model=PreviewUrlOut)
async def preview_url_externa(body: PreviewUrlRequest, current_user=Depends(require_admin)):
    """
    Extrae metadatos Open Graph (título, imagen, descripción) de una URL externa.
    Útil para previsualizar noticias de diarios antes de publicarlas.
    """
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        )
    }
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=10) as client:
            response = await client.get(body.url, headers=headers)
            response.raise_for_status()
    except Exception:
        raise HTTPException(status_code=422, detail="No se pudo acceder a la URL proporcionada.")

    soup = BeautifulSoup(response.text, "html.parser")

    def og(prop: str) -> Optional[str]:
        tag = soup.find("meta", property=f"og:{prop}")
        if tag and tag.get("content"):
            return str(tag["content"]).strip()
        tag = soup.find("meta", attrs={"name": f"og:{prop}"})
        if tag and tag.get("content"):
            return str(tag["content"]).strip()
        return None

    titulo = og("title") or (soup.title.string.strip() if soup.title else None)
    imagen_url = og("image")
    descripcion = og("description")

    if not imagen_url:
        # fallback: primera imagen grande de la página
        for img in soup.find_all("img", src=True):
            src = str(img["src"])
            if src.startswith("http") and any(ext in src.lower() for ext in [".jpg", ".jpeg", ".png", ".webp"]):
                imagen_url = src
                break

    return PreviewUrlOut(titulo=titulo, imagen_url=imagen_url, descripcion=descripcion)


# --- RUTAS ADMINISTRATIVAS ---
# 🔐 SUPERUSUARIO / ADMIN
@router.post("/", response_model=NoticiaOut, status_code=status.HTTP_201_CREATED)
def crear_nueva_noticia(noticia: NoticiaCreate, db: Session = Depends(get_db),
                         current_user = Depends(require_admin)):
    """ Crea una noticia desde el panel de administración """
    nueva_noticia = Noticia(**noticia.model_dump())
    db.add(nueva_noticia)
    db.commit()
    db.refresh(nueva_noticia)
    return nueva_noticia

# 🔐 SUPERUSUARIO / ADMIN
@router.put("/{id_noticia}", response_model=NoticiaOut)
def actualizar_noticia(
    id_noticia: int,
    noticia_update: NoticiaUpdate, 
    db: Session = Depends(get_db), 
    current_user=Depends(require_admin)):
    """ Actualiza una noticia existente """
    query = db.query(Noticia).filter(Noticia.id_noticia == id_noticia)
    noticia_db = query.first()

    if not noticia_db:
        raise HTTPException(status_code=404, detail="Noticia no existe")
    
    # Actualizamos solo los campos enviados
    update_data = noticia_update.model_dump(exclude_unset=True)
    update_data["actualizado_en"] = datetime.now()
    
    query.update(update_data)
    db.commit()
    db.refresh(noticia_db)
    return noticia_db

# 🔐 SUPERUSUARIO / ADMIN
@router.delete("/{id_noticia}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_noticia(id_noticia: int, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    """ 
    Soft Delete: No borra el registro, solo marca 'borrado_en'.
    Ideal para administradores que cometen errores.
    """
    noticia = db.query(Noticia).filter(Noticia.id_noticia == id_noticia).first()
    
    if not noticia:
        raise HTTPException(status_code=404, detail="Noticia no encontrada")
    
    noticia.borrado_en = datetime.now()
    db.commit()
    return None