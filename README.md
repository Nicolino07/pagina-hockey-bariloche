# Hockey Pista Bariloche — Sistema de Gestión Deportiva

Sistema web para la gestión y publicación de torneos de hockey sobre pista.
Permite a la organización administrar clubes, equipos, jugadores, partidos y estadísticas,
y expone un sitio público donde los participantes pueden consultar resultados,
posiciones y noticias en tiempo real.

---

## Funcionalidades principales

### Sitio público
- Tabla de posiciones automática por torneo y categoría
- Resultados de partidos con detalle de goles y tarjetas
- Fichas de clubes y equipos con sus planteles
- Sección de noticias
- Historial de partidos por equipo

### Panel de administración
- Carga digital de planillas de partidos (goles, tarjetas, resultado)
- Gestión de torneos: crear, inscribir equipos, finalizar, restaurar
- Gestión de clubes, equipos y planteles
- Gestión de personas con roles (jugador, árbitro, técnico, etc.)
- Sistema de fichajes por club y período
- Publicación y edición de noticias
- Gestión de usuarios con roles y permisos (EDITOR / ADMIN / SUPERUSUARIO)
- Invitación de nuevos usuarios por email con registro seguro

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Backend | Python 3.x + FastAPI |
| Base de datos | PostgreSQL |
| ORM | SQLAlchemy |
| Frontend | React + TypeScript (Vite) |
| Estilos | CSS Modules |
| Autenticación | JWT (access token) + Refresh token en cookie HTTP-only |
| Deploy | Docker + Docker Compose + Nginx |

---

## Estructura del proyecto

```
/
├── backend/
│   ├── app/
│   │   ├── auth/          # Autenticación y seguridad
│   │   ├── core/          # Configuración, email, middlewares
│   │   ├── dependencies/  # Permisos por rol
│   │   ├── models/        # Modelos SQLAlchemy
│   │   ├── routers/       # Endpoints de la API
│   │   ├── schemas/       # Schemas Pydantic
│   │   └── services/      # Lógica de negocio
│   └── db/
│       ├── init/          # Scripts SQL de inicialización
│       └── seed/          # Datos de prueba
├── frontend/
│   └── src/
│       ├── api/           # Llamadas al backend (Axios)
│       ├── auth/          # Contexto y rutas protegidas
│       ├── components/    # Componentes reutilizables
│       ├── hooks/         # Custom hooks
│       ├── pages/
│       │   ├── admin/     # Panel de administración
│       │   └── public/    # Sitio público
│       └── types/         # Tipos TypeScript
├── docker-compose.yml
└── nginx.conf
```

---

## Roles de usuario

| Rol | Permisos |
|---|---|
| EDITOR | Carga de planillas |
| ADMIN | Todo lo anterior +  getion de equipos (crear y actualizar), personas, noticias, integrantes de plantel |
| SUPERUSUARIO | Todo lo anterior + gestión de torneos, clubes, usuarios del sistema. Permisos completos |

---

## Levantar el proyecto

**Requisitos:** Docker y Docker Compose instalados.

```bash
# Levantar
docker compose up

# Levantar con rebuild (después de cambios en código)
docker compose up --build

# Bajar
docker compose down

# Bajar y limpiar volúmenes
docker compose down -v
```

La API queda disponible en `http://localhost:8000`
El frontend queda disponible en `http://localhost:80`
La documentación interactiva de la API en `http://localhost:8000/docs`

---

## Estado del proyecto

En desarrollo activo. Funcionalidades implementadas:
- Autenticación completa con refresh token
- Gestión de clubes, equipos, personas y fichajes
- Carga de planillas y tabla de posiciones
- Sitio público con resultados y noticias

Próximas funcionalidades:
- Fixture automático por categoría
- Exportación a Excel/PDF
- Estadísticas avanzadas por jugador


