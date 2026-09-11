"""
Generación dinámica del sitemap.xml del sitio público.

Expone `/sitemap.xml` (sin el prefijo `/api`) para que Google Search Console
pueda leerlo en `https://<dominio>/sitemap.xml`. Combina las rutas estáticas
del frontend con las páginas dinámicas (noticias y clubes) tomadas de la base.
"""
from datetime import datetime, timezone
from typing import List, Optional, Tuple
from xml.sax.saxutils import escape
import os

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.club import Club
from app.models.noticia import Noticia

router = APIRouter(tags=["SEO"])

# Dominio público del sitio (configurable por entorno)
SITE_URL: str = os.getenv("SITE_URL", "https://hockeybariloche.com.ar").rstrip("/")

# Rutas públicas estáticas: (path, changefreq, priority)
RUTAS_ESTATICAS: List[Tuple[str, str, str]] = [
    ("/", "daily", "1.0"),
    ("/noticias", "daily", "0.9"),
    ("/fixture", "daily", "0.9"),
    ("/resultados", "daily", "0.9"),
    ("/public/posiciones", "daily", "0.8"),
    ("/public/ranking", "weekly", "0.7"),
    ("/public/clubes", "weekly", "0.7"),
]


def _formatear_fecha(valor: Optional[datetime]) -> str:
    """Devuelve la fecha en formato W3C (YYYY-MM-DD) exigido por `lastmod`."""
    if valor is None:
        return datetime.now(timezone.utc).date().isoformat()
    return valor.date().isoformat()


def _url_xml(
    path: str,
    lastmod: str,
    changefreq: str,
    priority: str,
) -> str:
    """Arma un bloque `<url>` del sitemap para una ruta dada."""
    return (
        "  <url>\n"
        f"    <loc>{escape(SITE_URL + path)}</loc>\n"
        f"    <lastmod>{lastmod}</lastmod>\n"
        f"    <changefreq>{changefreq}</changefreq>\n"
        f"    <priority>{priority}</priority>\n"
        "  </url>"
    )


@router.get("/sitemap.xml", include_in_schema=False)
def generar_sitemap(db: Session = Depends(get_db)) -> Response:
    """
    Genera el sitemap.xml con las rutas públicas estáticas, las noticias
    propias (se excluyen las que redirigen a un sitio externo) y los clubes.
    """
    hoy = datetime.now(timezone.utc).date().isoformat()
    urls: List[str] = [
        _url_xml(path, hoy, changefreq, priority)
        for path, changefreq, priority in RUTAS_ESTATICAS
    ]

    noticias = (
        db.query(Noticia)
        .filter(Noticia.borrado_en.is_(None), Noticia.url_externa.is_(None))
        .order_by(Noticia.creado_en.desc())
        .all()
    )
    for noticia in noticias:
        lastmod = _formatear_fecha(noticia.actualizado_en or noticia.creado_en)
        urls.append(_url_xml(f"/noticias/{noticia.id_noticia}", lastmod, "monthly", "0.6"))

    clubes = db.query(Club).filter(Club.borrado_en.is_(None)).all()
    for club in clubes:
        lastmod = _formatear_fecha(club.actualizado_en or club.creado_en)
        urls.append(_url_xml(f"/public/clubes/{club.id_club}", lastmod, "weekly", "0.6"))

    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(urls)
        + "\n</urlset>\n"
    )
    return Response(
        content=xml,
        media_type="application/xml",
        headers={"Cache-Control": "public, max-age=3600"},
    )
