from .clubes import router as clubes_router
from .equipos import router as equipos_router
from .persona import router as personas_router
from .planteles import router as planteles_router
from .torneos import router as torneos_router
from .partidos import router as partidos_router
from .vistas import router as vistas_router
from .fichajes import router as fichajes_router
from .noticias import router as noticias_router
from .estadisticas import router as estadisticas_router
from .goles import router as goles_router
from .tarjetas import router as tarjetas_router
from .posiciones import router as posiciones_router

__all__ = [
    "clubes_router",
    "equipos_router",
    "personas_router",
    "planteles_router",
    "torneos_router",
    "partidos_router",
    "vistas_router",
    "fichajes_router",
    "noticias_router",
    "estadisticas_router",
    "goles_router",
    "tarjetas_router",
    "posiciones_router",
]