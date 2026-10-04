"""
Tests del límite de intentos de login.

  - Bloqueo por cuenta (app/auth/bloqueo.py): tras N fallos el email queda
    bloqueado aunque después llegue la contraseña correcta, se comporta igual
    para emails inexistentes y se levanta con un login exitoso o un reset.
  - IP real del cliente (app/core/rate_limit.py): el límite por IP usa el
    header configurado y no la IP del proxy.
"""
import threading
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from starlette.requests import Request

from app.main import app
from app.auth.bloqueo import reservar_intento
from app.auth.security import create_access_token, hash_password
from app.core.config import settings
from app.core.rate_limit import client_ip, limiter
from app.models.enums import TipoUsuario
from app.models.usuario import Usuario
from tests.conftest import TestingSessionLocal

MAX_INTENTOS = 3
PASSWORD = "Correcta-123"


def uid() -> str:
    return uuid4().hex[:8]


@pytest.fixture(autouse=True)
def config_bloqueo(monkeypatch):
    """Máximo chico para tests rápidos y límite por IP apagado (se prueba aparte)."""
    monkeypatch.setattr(settings, "max_login_attempts", MAX_INTENTOS)
    monkeypatch.setattr(settings, "login_block_minutes", 15)
    monkeypatch.setattr(limiter, "enabled", False)
    yield
    # Todos los tests usan el dominio reservado example.com.
    session = TestingSessionLocal()
    session.execute(text("DELETE FROM login_intento WHERE email LIKE '%@example.com'"))
    session.commit()
    session.close()


@pytest.fixture()
def client():
    return TestClient(app)


@pytest.fixture()
def usuario(db):
    """Usuario real en la base, con contraseña conocida."""
    email = f"login_{uid()}@example.com"
    user = Usuario(
        username=f"login_{uid()}",
        email=email,
        password_hash=hash_password(PASSWORD),
        tipo=TipoUsuario.LECTOR,
        activo=True,
    )
    db.add(user)
    db.commit()
    yield email
    db.execute(text("DELETE FROM refresh_token WHERE id_usuario = :id"), {"id": user.id_usuario})
    db.execute(text("DELETE FROM login_intento WHERE email = lower(:e)"), {"e": email})
    db.execute(text("DELETE FROM usuario WHERE id_usuario = :id"), {"id": user.id_usuario})
    db.commit()


def login(client, email, password, **kwargs):
    return client.post("/api/auth/login", data={"username": email, "password": password}, **kwargs)


def codigo(resp) -> str | None:
    return resp.json().get("error", {}).get("code")


# ─── Bloqueo por cuenta ──────────────────────────────────────────────────────

def test_bloquea_tras_max_fallos_aunque_llegue_la_password_correcta(client, usuario):
    for _ in range(MAX_INTENTOS):
        assert login(client, usuario, "incorrecta").status_code == 401

    resp = login(client, usuario, PASSWORD)
    assert resp.status_code == 429, resp.text
    assert codigo(resp) == "LOGIN_BLOQUEADO"


def test_login_exitoso_reinicia_el_contador(client, usuario):
    for _ in range(MAX_INTENTOS - 1):
        assert login(client, usuario, "incorrecta").status_code == 401
    assert login(client, usuario, PASSWORD).status_code == 200

    # Con el contador en cero vuelven a estar disponibles todos los intentos.
    for _ in range(MAX_INTENTOS):
        assert login(client, usuario, "incorrecta").status_code == 401
    assert login(client, usuario, PASSWORD).status_code == 429


def test_email_inexistente_se_comporta_igual_que_uno_real(client, usuario):
    """El bloqueo no debe revelar qué emails están registrados."""
    inexistente = f"nadie_{uid()}@example.com"
    secuencia_real = [login(client, usuario, "incorrecta").status_code for _ in range(MAX_INTENTOS + 1)]
    secuencia_falsa = [login(client, inexistente, "incorrecta").status_code for _ in range(MAX_INTENTOS + 1)]
    assert secuencia_real == secuencia_falsa == [401] * MAX_INTENTOS + [429]


def test_mayusculas_y_espacios_cuentan_como_el_mismo_email(client, usuario):
    variantes = [usuario.upper(), f"  {usuario}  ", usuario.capitalize()]
    for variante in variantes[:MAX_INTENTOS]:
        login(client, variante, "incorrecta")
    assert login(client, usuario, PASSWORD).status_code == 429


def test_bloqueo_vencido_permite_entrar(client, usuario, db):
    for _ in range(MAX_INTENTOS + 1):
        login(client, usuario, "incorrecta")
    db.execute(
        text("""
            UPDATE login_intento
            SET bloqueado_hasta = now() at time zone 'utc' - interval '1 minute',
                ultimo_intento  = now() at time zone 'utc' - interval '16 minutes'
            WHERE email = lower(:e)
        """),
        {"e": usuario},
    )
    db.commit()
    assert login(client, usuario, PASSWORD).status_code == 200


def test_reset_de_password_levanta_el_bloqueo(client, usuario):
    for _ in range(MAX_INTENTOS + 1):
        login(client, usuario, "incorrecta")
    assert login(client, usuario, PASSWORD).status_code == 429

    token = create_access_token({"sub": usuario, "type": "reset"})
    resp = client.post("/api/auth/reset-password-confirm", json={
        "token": token, "new_password": "Nueva-clave-456",
    })
    assert resp.status_code == 200, resp.text
    assert login(client, usuario, "Nueva-clave-456").status_code == 200


def test_pedidos_en_paralelo_no_superan_el_maximo():
    """El intento se reserva con lock de fila: N hilos a la vez no pasan todos."""
    email = f"paralelo_{uid()}@example.com"
    resultados = []
    barrera = threading.Barrier(10)

    def intentar():
        session = TestingSessionLocal()
        try:
            barrera.wait()
            resultados.append(reservar_intento(session, email))
        finally:
            session.close()

    hilos = [threading.Thread(target=intentar) for _ in range(10)]
    for h in hilos:
        h.start()
    for h in hilos:
        h.join()

    assert sum(1 for r in resultados if r is None) == MAX_INTENTOS

    session = TestingSessionLocal()
    session.execute(text("DELETE FROM login_intento WHERE email = :e"), {"e": email})
    session.commit()
    session.close()


# ─── IP real del cliente ─────────────────────────────────────────────────────

def _request(headers: dict, host: str = "10.0.0.2") -> Request:
    return Request({
        "type": "http",
        "headers": [(k.lower().encode(), v.encode()) for k, v in headers.items()],
        "client": (host, 12345),
    })


@pytest.mark.parametrize("header_config,headers,esperado", [
    ("", {"CF-Connecting-IP": "203.0.113.7"}, "10.0.0.2"),              # sin configurar: IP de la conexión
    ("CF-Connecting-IP", {"CF-Connecting-IP": "203.0.113.7"}, "203.0.113.7"),
    ("CF-Connecting-IP", {"CF-Connecting-IP": "2001:db8::1"}, "2001:db8::1"),
    ("CF-Connecting-IP", {}, "10.0.0.2"),                                # falta el header
    ("CF-Connecting-IP", {"CF-Connecting-IP": "no-es-una-ip"}, "10.0.0.2"),
    ("X-Forwarded-For", {"X-Forwarded-For": "198.51.100.4, 10.0.0.9"}, "198.51.100.4"),
])
def test_client_ip(monkeypatch, header_config, headers, esperado):
    monkeypatch.setattr(settings, "client_ip_header", header_config)
    assert client_ip(_request(headers)) == esperado


def test_client_ip_nunca_devuelve_algo_que_no_sea_ip(monkeypatch):
    """La IP va a columnas INET: un host que no es IP tiene que dar None."""
    monkeypatch.setattr(settings, "client_ip_header", "")
    assert client_ip(_request({}, host="testclient")) is None


def test_limite_por_ip_usa_la_ip_real_y_no_la_del_proxy(client, monkeypatch):
    """Con el header configurado, agotar el límite desde una IP no bloquea a otra."""
    monkeypatch.setattr(settings, "client_ip_header", "CF-Connecting-IP")
    monkeypatch.setattr(settings, "max_login_attempts", 100)  # que no interfiera el bloqueo por cuenta
    monkeypatch.setattr(limiter, "enabled", True)
    limiter.reset()

    atacante = {"CF-Connecting-IP": "203.0.113.10"}
    otro = {"CF-Connecting-IP": "203.0.113.20"}
    email = f"ip_{uid()}@example.com"

    for _ in range(5):  # límite de la ruta: 5/minute
        assert login(client, email, "x", headers=atacante).status_code == 401
    resp = login(client, email, "x", headers=atacante)
    assert resp.status_code == 429 and codigo(resp) == "RATE_LIMIT_EXCEEDED"

    assert login(client, email, "x", headers=otro).status_code == 401
    limiter.reset()
