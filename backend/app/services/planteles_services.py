import logging
from fastapi import HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.models.equipo import Equipo
from app.models.plantel import Plantel, PlantelIntegrante
from app.models.jugador import Jugador
from app.models.entrenador import Entrenador

logger = logging.getLogger(__name__)

def agregar_integrante_a_plantel(
    db: Session, 
    id_plantel: int,
    id_jugador: Optional[int] = None,
    id_entrenador: Optional[int] = None,
    rol: str = "Jugador",
    numero_camiseta: Optional[int] = None
):
    """
    Agrega un integrante (jugador o entrenador) a un plantel
    """
    # Validar que el plantel existe
    plantel = db.query(Plantel).filter(Plantel.id_plantel == id_plantel).first()
    if not plantel:
        raise HTTPException(status_code=404, detail="Plantel no encontrado")
    
    # Validar que se proporcione al menos un ID (jugador o entrenador)
    if not id_jugador and not id_entrenador:
        raise HTTPException(
            status_code=400, 
            detail="Debe proporcionar id_jugador o id_entrenador"
        )
    
    # Validar que no sean ambos
    if id_jugador and id_entrenador:
        raise HTTPException(
            status_code=400, 
            detail="Solo puede proporcionar id_jugador O id_entrenador, no ambos"
        )
    
    # Validar que el jugador existe si se proporciona
    if id_jugador:
        jugador = db.query(Jugador).filter(Jugador.id_jugador == id_jugador).first()
        if not jugador:
            raise HTTPException(status_code=404, detail="Jugador no encontrado")
        
        # Verificar si ya está en el plantel
        existe = db.query(PlantelIntegrante).filter(
            PlantelIntegrante.id_plantel == id_plantel,
            PlantelIntegrante.id_jugador == id_jugador
        ).first()
        if existe:
            raise HTTPException(
                status_code=400, 
                detail="El jugador ya está en este plantel"
            )
    
    # Validar que el entrenador existe si se proporciona
    if id_entrenador:
        entrenador = db.query(Entrenador).filter(
            Entrenador.id_entrenador == id_entrenador
        ).first()
        if not entrenador:
            raise HTTPException(status_code=404, detail="Entrenador no encontrado")
        
        # Verificar si ya está en el plantel
        existe = db.query(PlantelIntegrante).filter(
            PlantelIntegrante.id_plantel == id_plantel,
            PlantelIntegrante.id_entrenador == id_entrenador
        ).first()
        if existe:
            raise HTTPException(
                status_code=400, 
                detail="El entrenador ya está en este plantel"
            )
    
    # Validar rol
    roles_validos = ["Jugador", "Entrenador", "Asistente", "Utilero", 
                     "Medico", "Preparador Fisico", "Delegado", "Masajista"]
    if rol not in roles_validos:
        raise HTTPException(
            status_code=400, 
            detail=f"Rol no válido. Roles válidos: {', '.join(roles_validos)}"
        )
    
    # Crear el registro
    nuevo_integrante = PlantelIntegrante(
        id_plantel=id_plantel,
        id_jugador=id_jugador,
        id_entrenador=id_entrenador,
        rol=rol,
        numero_camiseta=numero_camiseta
    )
    
    try:
        db.add(nuevo_integrante)
        db.commit()
        db.refresh(nuevo_integrante)
        logger.info(f"Integrante agregado al plantel {id_plantel}")
        return nuevo_integrante
    except Exception as e:
        db.rollback()
        logger.error(f"Error al agregar integrante: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

def obtener_integrantes_plantel(db: Session, id_plantel: int):
    """
    Obtiene todos los integrantes de un plantel
    """
    plantel = db.query(Plantel).filter(Plantel.id_plantel == id_plantel).first()
    if not plantel:
        raise HTTPException(status_code=404, detail="Plantel no encontrado")
    
    return db.query(PlantelIntegrante).filter(
        PlantelIntegrante.id_plantel == id_plantel
    ).all()

def eliminar_integrante_plantel(db: Session, id_plantel_integrante: int):
    """
    Elimina un integrante de un plantel
    """
    integrante = db.query(PlantelIntegrante).filter(
        PlantelIntegrante.id_plantel_integrante == id_plantel_integrante
    ).first()
    
    if not integrante:
        raise HTTPException(status_code=404, detail="Integrante no encontrado")
    
    try:
        db.delete(integrante)
        db.commit()
        logger.info(f"Integrante {id_plantel_integrante} eliminado")
        return {"message": "Integrante eliminado correctamente"}
    except Exception as e:
        db.rollback()
        logger.error(f"Error al eliminar integrante: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")