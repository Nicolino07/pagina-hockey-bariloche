"""
Configuración global de pytest.
Usa la base de datos PostgreSQL real del contenedor.
Cada test corre dentro de una transacción que se deshace al terminar (rollback),
por lo que los datos no persisten entre tests ni afectan la DB real.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import get_db
from app.models.usuario import Usuario
from app.models.enums import TipoUsuario
from app.dependencies.permissions import require_superuser, require_admin, require_editor

# ─── Conexión a PostgreSQL del contenedor ────────────────────────────────────
TEST_DB_URL = "postgresql://hockey_user:hockey1234@db:5432/hockey_db"

engine = create_engine(TEST_DB_URL, future=True, pool_pre_ping=True)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)



@pytest.fixture()
def db():
    """
    Sesión simple por test. Los datos persisten en la DB
    pero los nombres únicos (uid) evitan colisiones entre corridas.
    """
    session = TestingSessionLocal()
    yield session
    session.close()


# ─── Usuarios mock ────────────────────────────────────────────────────────────

def _make_user(tipo: TipoUsuario) -> Usuario:
    user = Usuario()
    user.id_usuario = 1
    user.username = "test_user"
    user.tipo = tipo
    user.activo = True
    return user


@pytest.fixture()
def superuser():
    return _make_user(TipoUsuario.SUPERUSUARIO)


@pytest.fixture()
def admin_user():
    return _make_user(TipoUsuario.ADMIN)


@pytest.fixture()
def editor_user():
    return _make_user(TipoUsuario.EDITOR)


# ─── Clientes HTTP ────────────────────────────────────────────────────────────

def _client_with_user(user: Usuario) -> TestClient:
    app.dependency_overrides[require_superuser] = lambda: user
    app.dependency_overrides[require_admin] = lambda: user
    app.dependency_overrides[require_editor] = lambda: user
    return TestClient(app)


@pytest.fixture()
def client_superuser(superuser):
    yield _client_with_user(superuser)
    app.dependency_overrides.clear()


@pytest.fixture()
def client_admin(admin_user):
    yield _client_with_user(admin_user)
    app.dependency_overrides.clear()


@pytest.fixture()
def client_editor(editor_user):
    yield _client_with_user(editor_user)
    app.dependency_overrides.clear()


@pytest.fixture()
def client_publico():
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()
