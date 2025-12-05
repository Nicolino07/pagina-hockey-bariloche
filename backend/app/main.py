from fastapi import FastAPI
from app.database import Base, engine

# Routers
from app.routers.public.clubes_public import router as clubes_public_router
from app.routers.admin.clubes_admin import router as clubes_admin_router
from app.routers.public.equipos_public import router as equipos_public_router
from app.routers.admin.equipos_admin import router as equipos_admin_router
from app.routers.public.arbitros_public import router as arbitros_public_router
from app.routers.admin.arbitros_admin import router as arbitros_admin_router
from app.routers.public.entrenadores_public import router as entrenadores_public_router
from app.routers.admin.entrenadores_admin import router as entrenadores_admin_router
from app.routers.public.jugadores_public import router as jugadores_public_router
from app.routers.admin.jugadores_admin import router as jugadores_admin_router
from app.routers.public.participan_partido_public import router as participan_partido_public_router
from app.routers.admin.participan_partido_admin import router as participan_partido_admin_router
from app.routers.public.inscripciones_torneos_public import router as inscripciones_torneos_public_router
from app.routers.admin.inscripciones_torneos_admin import router as inscripciones_torneos_admin_router
from app.routers.public.tarjetas_public import router as tarjetas_public_router
from app.routers.admin.tarjetas_admin import router as tarjetas_admin_router    
from app.routers.public.torneos_public import router as torneos_public_router
from app.routers.admin.torneos_admin import router as torneos_admin_router  
from app.routers.public.planteles_public import router as planteles_equipos_public_router
from app.routers.admin.planteles_admin import router as planteles_equipos_admin_router




Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Hockey Bariloche API",
    version="1.0.0"
)

@app.get("/")
def root():
    return {"message": "API Hockey Bariloche funcionando"}

# Incluir routers

app.include_router(clubes_public_router)
app.include_router(clubes_admin_router)
app.include_router(equipos_public_router)
app.include_router(equipos_admin_router)
app.include_router(arbitros_public_router)
app.include_router(arbitros_admin_router)
app.include_router(entrenadores_public_router)
app.include_router(entrenadores_admin_router)   
app.include_router(jugadores_public_router)
app.include_router(jugadores_admin_router)
app.include_router(participan_partido_public_router)
app.include_router(participan_partido_admin_router)
app.include_router(planteles_equipos_public_router)
app.include_router(planteles_equipos_admin_router)
app.include_router(inscripciones_torneos_public_router)
app.include_router(inscripciones_torneos_admin_router)
app.include_router(tarjetas_public_router)
app.include_router(tarjetas_admin_router)
app.include_router(torneos_public_router)
app.include_router(torneos_admin_router)


