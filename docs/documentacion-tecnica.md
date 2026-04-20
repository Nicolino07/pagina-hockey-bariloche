# Documentación Técnica — Sistema de Gestión Hockey Pista Bariloche

## Índice

1. [Descripción general](#descripción-general)
2. [Stack tecnológico](#stack-tecnológico)
3. [Arquitectura del sistema](#arquitectura-del-sistema)
4. [Estructura del repositorio](#estructura-del-repositorio)
5. [Configuración del entorno](#configuración-del-entorno)
6. [Levantar el proyecto](#levantar-el-proyecto)
7. [Base de datos](#base-de-datos)
8. [Backend — API REST](#backend--api-rest)
9. [Frontend — React](#frontend--react)
10. [Autenticación y seguridad](#autenticación-y-seguridad)
11. [Migraciones](#migraciones)
12. [Backups](#backups)
13. [Deploy en producción](#deploy-en-producción)

---

## Descripción general

Sistema web de gestión de torneos de hockey sobre pista. Incluye:

- Gestión de clubes, equipos, personas y planteles
- Carga de planillas de partidos (goles, tarjetas, participantes)
- Fixture y tabla de posiciones automática
- Estadísticas: goleadores, valla menos vencida, tarjetas acumuladas
- Sección de noticias
- Sistema de usuarios con roles y permisos
- Auditoría completa de cambios
- Sitio público sin autenticación + panel administrativo

---

## Stack tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Backend | Python + FastAPI | 3.x / 0.104.1 |
| ORM | SQLAlchemy | 2.0.23 |
| Validación | Pydantic v2 | 2.5.0 |
| Migraciones | Alembic | 1.12.1 |
| Base de datos | PostgreSQL | 15 |
| Frontend | React + TypeScript | 19.x / ~5.9 |
| Bundler | Vite | 7.x |
| Router | React Router DOM | 7.x |
| HTTP client | Axios | 1.x |
| PDF | jsPDF + autotable | 2.5 / 3.8 |
| Proxy | Nginx | alpine |
| Contenedores | Docker + Compose | - |
| Autenticación | JWT (python-jose) + bcrypt/argon2 | - |
| Email | Resend | - |
| Rate limiting | SlowAPI | 0.1.9 |

---

## Arquitectura del sistema

```
                        ┌─────────────────────┐
                        │     Nginx (80)       │
                        └────────┬────────────┘
                                 │
               ┌─────────────────┴─────────────────┐
               │                                   │
     ┌─────────▼──────────┐             ┌──────────▼──────────┐
     │  Frontend React    │             │   API FastAPI        │
     │  (puerto 5173/80)  │             │   (puerto 8000)      │
     └────────────────────┘             └──────────┬──────────┘
                                                   │
                                        ┌──────────▼──────────┐
                                        │  PostgreSQL 15       │
                                        │  (puerto 5434)       │
                                        └─────────────────────┘
```

Los cuatro servicios corren en la red interna `hockey-network` vía Docker Compose. Solo Nginx expone puertos al exterior. La base de datos solo acepta conexiones desde `127.0.0.1:5434` en el host (no expuesta públicamente).

**Flujo de una request:**
1. El navegador hace una request a `hockeybariloche.com.ar`
2. Nginx enruta: `/api/*` → FastAPI, todo lo demás → React
3. React consulta la API bajo `/api/`
4. FastAPI valida JWT, aplica permisos por rol y responde

---

## Estructura del repositorio

```
/
├── backend/
│   ├── app/
│   │   ├── auth/          # Autenticación: login, JWT, invitaciones, recuperación
│   │   ├── core/          # Config, excepciones, email, middleware, auditoría
│   │   ├── dependencies/  # Dependencias FastAPI: auth y permisos
│   │   ├── models/        # Modelos SQLAlchemy (una tabla = un archivo)
│   │   ├── routers/       # Endpoints REST (uno por entidad)
│   │   ├── schemas/       # Schemas Pydantic (request/response)
│   │   ├── services/      # Lógica de negocio (separada de los routers)
│   │   ├── utils/         # Helpers (db session, etc.)
│   │   ├── database.py    # Configuración de la sesión SQLAlchemy
│   │   └── main.py        # Punto de entrada FastAPI
│   ├── db/
│   │   ├── init/          # Scripts SQL de inicialización (ejecutan en orden)
│   │   └── seed/          # Datos de prueba para desarrollo
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/           # Funciones de llamada a la API (por entidad)
│   │   ├── pages/
│   │   │   ├── public/    # Páginas sin autenticación
│   │   │   └── admin/     # Páginas del panel administrativo
│   │   └── components/    # Componentes reutilizables
│   └── package.json
├── backups/               # Scripts de backup y restauración
├── docs/                  # Documentación
├── nginx.conf             # Config Nginx producción
├── nginx.local.conf       # Config Nginx desarrollo local
├── docker-compose.yml     # Compose base
└── docker-compose.override.yml  # Overrides para desarrollo
```

---

## Configuración del entorno

El proyecto usa un archivo `.env` en la raíz. Crear a partir del siguiente template:

```env
# Base de datos
POSTGRES_DB=hockey
POSTGRES_USER=hockey_user
POSTGRES_PASSWORD=<contraseña-segura>
DATABASE_URL=postgresql://hockey_user:<contraseña>@db:5432/hockey

# JWT
JWT_SECRET=<string-aleatorio-largo>
JWT_ALGORITHM=HS256

# Tokens
ACCESS_TOKEN_EXPIRE_MINUTES=1440
REFRESH_TOKEN_EXPIRE_DAYS=30

# Email (Resend)
RESEND_API_KEY=<api-key-de-resend>
FRONTEND_URL=https://hockeybariloche.com.ar

# Cookies
COOKIE_SECURE=True           # False en desarrollo local
COOKIE_SAMESITE=strict

# App
ENVIRONMENT=production       # o "development"
ENABLE_SWAGGER=False         # True para habilitar /api/docs

# Frontend
VITE_API_URL=https://hockeybariloche.com.ar
FRONTEND_TARGET=production   # o "development"

# Nginx
HOST_PORT=80

# CORS
CORS_ALLOW_ORIGINS=https://hockeybariloche.com.ar
```

> **Importante:** nunca subir el `.env` al repositorio. Está en `.gitignore`.

---

## Levantar el proyecto

### Requisitos previos

- Docker y Docker Compose instalados
- Archivo `.env` configurado en la raíz

### Desarrollo local

```bash
# Primera vez (construye imágenes y levanta)
docker compose up --build

# Veces siguientes
docker compose up

# Detener
docker compose down

# Detener y eliminar volúmenes (limpia la base de datos)
docker compose down -v
```

El frontend queda disponible en `http://localhost:5173` y la API en `http://localhost:8000/api/`.

### Con Swagger habilitado (desarrollo)

Agregar en `.env`:
```env
ENABLE_SWAGGER=True
```
Luego acceder a `http://localhost:8000/api/docs`.

### Seed de datos de prueba

Los scripts en `backend/db/seed/` se ejecutan automáticamente al iniciar el contenedor si la base de datos está vacía. Incluyen clubes, equipos, personas, torneos, usuarios y más.

---

## Base de datos

### Inicialización

Los scripts en `backend/db/init/` se ejecutan en orden al crear el contenedor por primera vez:

| Archivo | Contenido |
|---------|-----------|
| `001_enums.sql` | Tipos enumerados (roles, categorías, géneros, estados) |
| `002_tables.sql` | Tablas base: club, equipo, persona, fichaje, etc. |
| `003_tables_extra.sql` | Tablas adicionales: partidos, goles, tarjetas, suspensiones |
| `004_functions.sql` | Funciones PL/pgSQL auxiliares |
| `005_triggers.sql` | Triggers (ej: actualización automática de timestamps) |
| `006_views.sql` | Vistas materializadas: posiciones, estadísticas |
| `007_grants.sql` | Permisos por usuario de base de datos |
| `008_auditoria.sql` | Tabla y triggers de auditoría |
| `009_index.sql` | Índices para performance |

### Modelo de datos principal

```
club ──< equipo ──< plantel ──< plantel_integrante
                                       │
persona ──< persona_rol ───────────────┘
    │
    └──< fichaje_rol >── club

torneo ──< inscripcion_torneo >── equipo
       └──< partido ──< gol
                   └──< tarjeta
                   └──< participan_partido
                   └──< suspension

usuario (tabla independiente, ligada a persona opcionalmente)
```

### Convenciones de tablas

- **Soft delete**: todas las entidades principales tienen `borrado_en TIMESTAMP` y `borrado_por VARCHAR`. Un registro con `borrado_en IS NOT NULL` se considera eliminado, pero permanece en la base.
- **Auditoría**: campos `creado_en`, `actualizado_en`, `creado_por`, `actualizado_por` en todas las tablas.
- **IDs**: `INT GENERATED ALWAYS AS IDENTITY` (autoincremental nativo de PostgreSQL).

### Enums principales

| Enum | Valores |
|------|---------|
| `tipo_rol_persona` | JUGADOR, ARBITRO, ENTRENADOR, DELEGADO, etc. |
| `tipo_categoria` | MAYORES, SUB_19, SUB_16, SUB_14, etc. |
| `tipo_genero` | MASCULINO, FEMENINO, MIXTO |
| `tipo_estado_partido` | BORRADOR, TERMINADO, SUSPENDIDO, ANULADO, REPROGRAMADO |
| `tipo_tarjeta` | AMARILLA, ROJA |
| `tipo_gol` | JUGADA, CORNER, PENAL, DEFINICION |
| `tipo_rol_usuario` | SUPERUSUARIO, ADMIN, EDITOR, LECTOR |

### Vistas materializadas

La tabla de posiciones se calcula desde una vista SQL (`006_views.sql`) que agrega resultados de partidos en estado TERMINADO. No se recalcula manualmente; se actualiza automáticamente.

---

## Backend — API REST

### Estructura de un módulo

Cada entidad sigue el patrón:

```
models/entidad.py      → Modelo SQLAlchemy (mapeo a tabla)
schemas/entidad.py     → Schemas Pydantic (validación entrada/salida)
services/entidad.py    → Lógica de negocio (queries, reglas)
routers/entidad.py     → Endpoints FastAPI (HTTP handlers)
```

### Prefijo base

Todos los endpoints tienen el prefijo `/api`. Ejemplo: `GET /api/clubes`.

### Endpoints disponibles

#### Auth (`/api/auth`)
| Método | Ruta | Descripción | Rol mínimo |
|--------|------|-------------|-----------|
| POST | `/login` | Iniciar sesión | Público |
| POST | `/refresh` | Renovar access token | Autenticado |
| POST | `/logout` | Cerrar sesión | Autenticado |
| GET | `/me` | Datos del usuario actual | Autenticado |
| POST | `/invitar` | Invitar nuevo usuario por email | Superusuario |
| POST | `/recuperar-password` | Enviar email de recuperación | Público |
| POST | `/reset-password-confirm` | Confirmar nueva contraseña | Público |
| PATCH | `/cambiar-password` | Cambiar contraseña propia | Autenticado |
| GET | `/usuarios` | Listar usuarios | Superusuario |
| PATCH | `/usuarios/{id}/rol` | Cambiar rol de usuario | Superusuario |
| PATCH | `/usuarios/{id}/estado` | Activar/desactivar usuario | Superusuario |

#### Clubes (`/api/clubes`)
| Método | Ruta | Rol mínimo |
|--------|------|-----------|
| GET | `/` | Público |
| GET | `/{id}` | Público |
| POST | `/` | Superusuario |
| PUT | `/{id}` | Superusuario |
| DELETE | `/{id}` | Superusuario |
| POST | `/{id}/restore` | Superusuario |

#### Equipos (`/api/equipos`)
| Método | Ruta | Rol mínimo |
|--------|------|-----------|
| GET | `/` | Público |
| GET | `/{id}` | Público |
| POST | `/` | Admin |
| PUT | `/{id}` | Admin |
| DELETE | `/{id}` | Superusuario |
| POST | `/{id}/restore` | Superusuario |

#### Personas (`/api/personas`)
| Método | Ruta | Rol mínimo |
|--------|------|-----------|
| GET | `/` | Editor |
| GET | `/{id}` | Editor |
| POST | `/` | Admin |
| PUT | `/{id}` | Admin |
| DELETE | `/{id}` | Admin |
| POST | `/{id}/roles` | Admin |
| PUT | `/{id}/roles/{rol_id}` | Admin |

#### Torneos (`/api/torneos`)
| Método | Ruta | Rol mínimo |
|--------|------|-----------|
| GET | `/` | Público |
| GET | `/{id}` | Público |
| POST | `/` | Superusuario |
| PUT | `/{id}` | Superusuario |
| DELETE | `/{id}` | Superusuario |
| POST | `/{id}/finalizar` | Superusuario |
| POST | `/{id}/reabrir` | Superusuario |
| POST | `/{id}/restaurar` | Superusuario |

#### Inscripciones (`/api/torneos/{id}/inscripciones`)
| Método | Ruta | Rol mínimo |
|--------|------|-----------|
| GET | `/` | Público |
| POST | `/` | Admin |
| DELETE | `/{id_equipo}/BAJA` | Admin |

#### Partidos (`/api/partidos`)
| Método | Ruta | Rol mínimo |
|--------|------|-----------|
| GET | `/recientes` | Público |
| GET | `/{id}` | Público |
| GET | `/equipos/{id_equipo}` | Público |
| POST | `/planilla` | Editor |
| PUT | `/planilla/{id}` | Editor |
| DELETE | `/{id}` | Superusuario |

#### Fixture (`/api/fixture`)
| Método | Ruta | Rol mínimo |
|--------|------|-----------|
| GET | `/proximos` | Público |
| GET | `/{id}` | Público |
| GET | `/torneo/{id}` | Público |
| POST | `/` | Editor |
| PUT | `/{id}` | Editor |
| DELETE | `/{id}` | Editor |

#### Planteles (`/api/planteles`)
| Método | Ruta | Rol mínimo |
|--------|------|-----------|
| GET | `/activo/{id_equipo}` | Público |
| GET | `/{id}/integrantes` | Público |
| POST | `/` | Admin |
| POST | `/integrantes` | Admin |
| PATCH | `/{id}/cerrar` | Editor |
| DELETE | `/{id}` | Admin |
| DELETE | `/integrantes/{id}` | Admin |

#### Fichajes (`/api/fichajes`)
| Método | Ruta | Rol mínimo |
|--------|------|-----------|
| GET | `/club/{id}` | Público |
| GET | `/disponibles` | Editor |
| POST | `/` | Admin |
| PATCH | `/{id}/baja` | Admin |

#### Noticias (`/api/noticias`)
| Método | Ruta | Rol mínimo |
|--------|------|-----------|
| GET | `/` | Público |
| GET | `/{id}` | Público |
| POST | `/` | Admin |
| PUT | `/{id}` | Admin |
| DELETE | `/{id}` | Admin |
| POST | `/preview-url` | Admin |

#### Estadísticas y vistas
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/stats/global` | Estadísticas globales |
| GET | `/api/vistas/torneos/{id}/posiciones` | Tabla de posiciones |
| GET | `/api/vistas/goleadores/{id_torneo}` | Goleadores del torneo |
| GET | `/api/vistas/valla-menos-vencida/{id_torneo}` | Valla menos vencida |
| GET | `/api/vistas/tarjetas-acumuladas` | Ranking de tarjetas |

### Manejo de errores

Todos los errores siguen el formato:

```json
{
  "code": "CODIGO_ERROR",
  "message": "Descripción en español"
}
```

Códigos de estado usados: `400`, `401`, `403`, `404`, `409`, `422`, `429`, `500`.

---

## Frontend — React

### Estructura de `src/`

```
src/
├── api/              # Llamadas a la API agrupadas por entidad
│   ├── config/       # Instancia Axios con baseURL e interceptores
│   └── vistas/       # Endpoints de vistas especiales
├── pages/
│   ├── public/       # Páginas sin autenticación
│   └── admin/        # Páginas del panel admin (requieren auth)
└── components/       # Componentes reutilizables
```

### Convenciones

- Componentes: `PascalCase`
- Variables y funciones: `camelCase`
- Llamadas a la API: funciones en `src/api/<entidad>.api.ts`
- Rutas protegidas: usan un componente `ProtectedRoute` que verifica el token y el rol

### Rutas principales

| Ruta | Tipo | Descripción |
|------|------|-------------|
| `/` | Público | Home |
| `/public/clubes` | Público | Listado de clubes |
| `/public/posiciones` | Público | Tabla de posiciones |
| `/public/ranking` | Público | Goleadores y estadísticas |
| `/fixture` | Público | Próximos partidos |
| `/resultados` | Público | Partidos jugados |
| `/noticias` | Público | Noticias |
| `/login` | Público | Login |
| `/admin` | Auth | Dashboard admin |
| `/admin/partidos` | Editor+ | Gestión de planillas |
| `/admin/fixture` | Editor+ | Gestión de fixture |
| `/admin/noticias` | Admin+ | Gestión de noticias |
| `/admin/personas` | Admin+ | Gestión de personas |
| `/admin/equipos/:id` | Admin+ | Gestión de equipos |
| `/admin/clubes` | Superusuario | Gestión de clubes |
| `/admin/torneos` | Superusuario | Gestión de torneos |
| `/login/usuarios` | Superusuario | Gestión de usuarios |

### Build para producción

```bash
docker compose up --build
```

El frontend se construye con `vite build` dentro del contenedor y se sirve desde Nginx.

---

## Autenticación y seguridad

### Flujo JWT

1. El usuario hace POST `/api/auth/login` con credenciales.
2. El servidor responde con:
   - **Access token** (JWT de corta duración, en el body)
   - **Refresh token** (en cookie HTTP-only, 30 días)
3. El frontend incluye el access token en el header `Authorization: Bearer <token>`.
4. Al vencer el access token, el frontend llama a `/api/auth/refresh` (la cookie se envía automáticamente).
5. El servidor valida el refresh token y emite nuevos tokens.

### Roles y jerarquía

```
SUPERUSUARIO > ADMIN > EDITOR > LECTOR
```

Las dependencias FastAPI `require_superusuario`, `require_admin`, `require_editor` en `dependencies/permissions.py` se usan como parámetros en cada endpoint.

### Seguridad adicional

- **Rate limiting**: login limitado a 5 req/min por IP (SlowAPI).
- **Hashing de contraseñas**: argon2 (con fallback a bcrypt vía passlib).
- **Cookies**: `HttpOnly`, `Secure=True` en producción, `SameSite=strict`.
- **CORS**: orígenes permitidos configurados desde `.env`.
- **Invitación de usuarios**: los nuevos usuarios se registran solo desde un enlace de email con token temporal; no hay registro público.

---

## Migraciones

El proyecto usa **Alembic** para migraciones de esquema. La inicialización base se hace por SQL (scripts en `db/init/`). Alembic se usa para cambios incrementales después del deploy inicial.

Consultar `ALEMBIC_MANUAL.txt` en la raíz para el flujo de trabajo detallado.

Comandos básicos:

```bash
# Generar nueva migración (dentro del contenedor api)
docker compose exec api alembic revision --autogenerate -m "descripcion"

# Aplicar migraciones pendientes
docker compose exec api alembic upgrade head

# Ver historial
docker compose exec api alembic history
```

---

## Backups

Los scripts en `backups/` permiten hacer backup y restaurar la base de datos:

```bash
# Crear backup
./backups/backup_hockey.sh

# Restaurar backup
./backups/restore_hockey.sh <archivo-backup>
```

Los backups generan un dump `.sql` de PostgreSQL con fecha en el nombre.

---

## Deploy en producción

### Requisitos del servidor

- Docker y Docker Compose
- Puerto 80 disponible
- Dominio apuntando al servidor (`hockeybariloche.com.ar`)

### Pasos

1. Clonar el repositorio en el servidor.
2. Crear el archivo `.env` con valores de producción (ver sección [Configuración del entorno](#configuración-del-entorno)).
3. Asegurarse de que `COOKIE_SECURE=True`, `ENVIRONMENT=production`, `ENABLE_SWAGGER=False`.
4. Levantar:
   ```bash
   docker compose up --build -d
   ```
5. Verificar que los contenedores corren:
   ```bash
   docker compose ps
   ```

### Nginx

El archivo `nginx.conf` configura el proxy para producción con el dominio `hockeybariloche.com.ar`. Para desarrollo local se usa `nginx.local.conf`.

### Variables de entorno críticas para producción

| Variable | Valor recomendado |
|----------|-------------------|
| `COOKIE_SECURE` | `True` |
| `ENVIRONMENT` | `production` |
| `ENABLE_SWAGGER` | `False` |
| `JWT_SECRET` | String aleatorio de al menos 64 caracteres |
| `POSTGRES_PASSWORD` | Contraseña fuerte |
| `FRONTEND_URL` | URL pública del sitio |
| `CORS_ALLOW_ORIGINS` | URL pública del sitio |

---

## Logs y diagnóstico

```bash
# Ver logs en tiempo real de todos los servicios
docker compose logs -f

# Logs de un servicio específico
docker compose logs -f api
docker compose logs -f frontend
docker compose logs -f db

# Abrir shell en el contenedor de la API
docker compose exec api bash

# Conectarse a la base de datos
docker compose exec db psql -U hockey_user -d hockey
```

---

*Versión 1.0 — Sistema de Gestión Hockey Pista Bariloche*
