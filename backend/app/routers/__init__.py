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

__all__ = [
    "vistas_router",
    "estadisticas_router",
]