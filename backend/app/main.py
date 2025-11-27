from fastapi import FastAPI
from app.database import Base, engine

# Routers
from app.routers.public.clubes_public import router as clubes_public_router
from app.routers.admin.clubes_admin import router as clubes_admin_router

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