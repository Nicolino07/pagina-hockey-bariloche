# backend/app/auth/bloqueo.py
"""
Bloqueo temporal de login por cuenta.

Complementa el límite por IP: frena la fuerza bruta distribuida, que usa
muchas IPs contra un mismo email.

El intento se registra ANTES de verificar la contraseña y bajo un lock de
fila: si se contara después, N pedidos en paralelo pasarían todos el chequeo
antes de que el primero sumara el fallo. Un login exitoso borra el registro.
"""
from datetime import datetime, timedelta

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.login_intento import LoginIntento

# Registros sin actividad durante este tiempo se borran solos.
_RETENCION = timedelta(days=1)


def normalizar_email(email: str) -> str:
    return email.strip().lower()[:255]


def reservar_intento(db: Session, email: str) -> datetime | None:
    """Cuenta un intento de login para `email` y hace commit.

    Devuelve la fecha hasta la que el email está bloqueado si este intento no
    debe verificarse, o None si puede seguir. Los fallos se cuentan dentro de
    una ventana de `login_block_minutes`; el intento que supera
    `max_login_attempts` dispara el bloqueo por ese mismo tiempo.
    """
    clave = normalizar_email(email)
    ahora = datetime.utcnow()
    ventana = timedelta(minutes=settings.login_block_minutes)

    db.execute(
        text("""
            INSERT INTO login_intento (email, intentos, ultimo_intento)
            VALUES (:email, 0, :ahora)
            ON CONFLICT (email) DO NOTHING
        """),
        {"email": clave, "ahora": ahora},
    )
    registro = (
        db.query(LoginIntento)
        .filter(LoginIntento.email == clave)
        .with_for_update()
        .one()
    )

    if registro.bloqueado_hasta and registro.bloqueado_hasta > ahora:
        db.commit()
        return registro.bloqueado_hasta

    if registro.bloqueado_hasta or registro.ultimo_intento < ahora - ventana:
        # Bloqueo vencido o fallos viejos: se empieza a contar de nuevo.
        registro.intentos = 0
        registro.bloqueado_hasta = None

    registro.intentos += 1
    registro.ultimo_intento = ahora
    if registro.intentos > settings.max_login_attempts:
        registro.bloqueado_hasta = ahora + ventana

    bloqueado_hasta = registro.bloqueado_hasta
    _purgar_vencidos(db, ahora)
    db.commit()
    return bloqueado_hasta


def limpiar_intentos(db: Session, email: str) -> None:
    """Borra el registro de intentos de `email` (login exitoso o reset de contraseña)."""
    db.query(LoginIntento).filter(
        LoginIntento.email == normalizar_email(email)
    ).delete(synchronize_session=False)


def _purgar_vencidos(db: Session, ahora: datetime) -> None:
    db.query(LoginIntento).filter(
        LoginIntento.ultimo_intento < ahora - _RETENCION,
        (LoginIntento.bloqueado_hasta.is_(None)) | (LoginIntento.bloqueado_hasta < ahora),
    ).delete(synchronize_session=False)
