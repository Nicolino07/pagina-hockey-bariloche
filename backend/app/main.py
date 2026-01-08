
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



from app.routers import (
    clubes_router as clubes,
    equipos_router as equipos,
    personas_router as personas,
    planteles_router as planteles,
    torneos_router as torneos,
)
# se importa el router de autenticación
from app.auth.router import router as auth_router


app = FastAPI(
    title="Hockey Bariloche API",
    version="1.1.0"
)

@app.get("/")
def root():
    return {"message": "API Hockey Bariloche funcionando"}


# Routers 
app.include_router(clubes)
app.include_router(equipos)
app.include_router(personas)
app.include_router(planteles)
app.include_router(torneos)
# Router de autenticación incluido
app.include_router(auth_router)