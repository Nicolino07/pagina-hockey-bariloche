
from app.database import Base, engine
from fastapi import FastAPI, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi.responses import JSONResponse
from app import models


limiter = Limiter(key_func=get_remote_address)

app = FastAPI()

app.state.limiter = limiter
app.add_exception_handler(
    RateLimitExceeded,
    lambda request, exc: JSONResponse(
        status_code=429,
        content={"detail": "Demasiadas solicitudes"}
    )
)


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
# se importa el router de autenticación
from app.auth.router import router as auth_router


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

# Router de autenticación incluido
app.include_router(auth_router)