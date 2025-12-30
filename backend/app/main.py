from fastapi import FastAPI
from app.database import Base, engine

from app.routers.public import (
    clubes_router as public_clubes,
    equipos_router as public_equipos,
    planteles_router as public_planteles,
    torneos_router as public_torneos,
)

from app.routers.admin import (
    clubes_router as admin_clubes,
    equipos_router as admin_equipos,
    personas_router as admin_personas,
    planteles_router as admin_planteles,
    torneos_router as admin_torneos,
)


# SOLO desarrollo
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Hockey Bariloche API",
    version="1.0.0"
)

@app.get("/")
def root():
    return {"message": "API Hockey Bariloche funcionando"}

# Routers públicos
app.include_router(public_clubes)
app.include_router(public_equipos)
app.include_router(public_planteles)
app.include_router(public_torneos)

# Routers admin
app.include_router(admin_clubes)
app.include_router(admin_equipos)
app.include_router(admin_personas)
app.include_router(admin_planteles)
app.include_router(admin_torneos)

