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

En desarrollo, Docker Compose carga automáticamente `docker-compose.yml` **y** `docker-compose.override.yml`. El override aplica las siguientes diferencias respecto a producción:

| Servicio | Cambio en desarrollo |
|----------|----------------------|
| `nginx` | Usa `nginx.local.conf` en lugar de `nginx.conf` |
| `frontend` | Expone el puerto `5173` al host |
| `api` | Expone el puerto `8000` al host y monta la carpeta `tests/` |
| `api` | Ejecuta `entrypoint.sh` en lugar de uvicorn directo |

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

> En producción el override **no existe**, así que Docker solo usa `docker-compose.yml`. Los puertos de la API y el frontend no se exponen al exterior; todo el tráfico pasa por Nginx.

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
| `002_tables.sql` | Tablas base: club, equipo, persona, fichaje, planteles, torneos, posiciones |
| `003_tables_extra.sql` | Tablas adicionales: usuario, refresh_token, fixture, noticias |
| `004_functions.sql` | Funciones PL/pgSQL auxiliares |
| `005_triggers.sql` | Triggers (ej: actualización automática de timestamps) |
| `006_views.sql` | Vistas: posiciones, estadísticas |
| `007_grants.sql` | Permisos por usuario de base de datos |
| `008_auditoria.sql` | Tabla y triggers de auditoría |
| `009_index.sql` | Índices para performance |

---

### Convenciones de tablas

- **Soft delete**: las entidades principales tienen `borrado_en TIMESTAMP`. Un registro con `borrado_en IS NOT NULL` está eliminado lógicamente pero se conserva en la base.
- **Auditoría**: todos los modelos tienen `creado_en`, `actualizado_en`, `creado_por`, `actualizado_por`.
- **IDs**: `INT GENERATED ALWAYS AS IDENTITY` (autoincremental nativo de PostgreSQL).

---

### Tipos enumerados (ENUMs)

| Enum | Valores |
|------|---------|
| `tipo_genero` | `MASCULINO`, `FEMENINO`, `MIXTO` |
| `tipo_categoria` | `MAYORES`, `SUB_19`, `SUB_16`, `SUB_14`, `SUB_12` |
| `tipo_rol_persona` | `JUGADOR`, `DT`, `ARBITRO`, `ASISTENTE`, `MEDICO`, `PREPARADOR_FISICO`, `DELEGADO` |
| `tipo_estado_partido` | `BORRADOR`, `PENDIENTE`, `TERMINADO`, `SUSPENDIDO`, `ANULADO`, `REPROGRAMADO` |
| `tipo_tarjeta` | `VERDE`, `AMARILLA`, `ROJA` |
| `tipo_estado_tarjeta` | `VALIDA`, `ANULADA`, `CORREGIDA` |
| `tipo_gol` | `GJ` (jugada), `GC` (córner), `GP` (penal), `DP` (desvío penal) |
| `tipo_estado_gol` | `VALIDO`, `ANULADO`, `CORREGIDO` |
| `tipo_suspension` | `POR_PARTIDOS`, `POR_FECHA` |
| `tipo_estado_suspension` | `ACTIVA`, `CUMPLIDA`, `ANULADA` |
| `tipo_fase` | `LIGA`, `ELIMINACION`, `GRUPOS` |
| `tipo_torneo` | `LIGA`, `PLAYOFF`, `COPA` |
| `tipo_usuario` | `SUPERUSUARIO`, `ADMIN`, `EDITOR`, `LECTOR` |

---

### Entidades y relaciones

#### Diagrama general

```
club ──────────────────< equipo
 │                          │
 └──< fichaje_rol           └──< plantel ──< plantel_integrante
        │                                         │
persona ┤                                    persona │
 │      └── persona_rol                             │
 └──< persona_rol                        fichaje_rol (opcional)


torneo ──< inscripcion_torneo >── equipo
   │
   ├──< fase
   │
   └──< partido
            ├── inscripcion_torneo (local)
            ├── inscripcion_torneo (visitante)
            ├──< participan_partido ──< plantel_integrante
            │         ├──< gol
            │         └──< tarjeta
            └──< suspension (via persona_rol)


fixture_fecha ──> torneo
              ──> equipo (descansa, opcional — cuando el número de equipos es impar)

fixture_playoff_ronda ──> torneo

fixture_partido ──> torneo
                ──> equipo (local y visitante, nullable en playoff)
                ──> fixture_fecha (agrupación por jornada, NULL en playoff)
                ──> fixture_playoff_ronda (NULL en fixture de liga)
                ──> partido (cuando se carga la planilla real)

usuario (independiente)
refresh_token ──> usuario
noticias (independiente)
posicion ──> torneo, equipo
```

---

#### Descripción de cada tabla

**`club`**
Organización deportiva. Raíz de la jerarquía.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id_club` | INT PK | Identificador |
| `nombre` | VARCHAR(100) | Nombre del club |
| `provincia` | VARCHAR(100) | Provincia |
| `ciudad` | VARCHAR(100) | Ciudad |
| `direccion` | VARCHAR(200) | Dirección (opcional) |
| `telefono` | VARCHAR(20) | Teléfono (opcional) |
| `email` | VARCHAR(100) | Email (opcional) |

Restricción: `(nombre, ciudad)` únicos.

---

**`equipo`**
Equipo competitivo de un club en una categoría y género específicos.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id_equipo` | INT PK | Identificador |
| `nombre` | VARCHAR(100) | Nombre del equipo |
| `id_club` | INT FK → club | Club al que pertenece |
| `categoria` | tipo_categoria | Categoría (MAYORES, SUB_19, etc.) |
| `division` | VARCHAR(30) | División (opcional) |
| `genero` | tipo_genero | Género del equipo |

Restricción: `(id_club, nombre, categoria, division, genero)` únicos.

---

**`persona`**
Individuo del sistema (jugador, árbitro, DT, delegado, etc.).

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id_persona` | INT PK | Identificador |
| `documento` | INT UNIQUE | DNI (opcional, único si presente) |
| `nombre` | VARCHAR(100) | Nombre |
| `apellido` | VARCHAR(100) | Apellido |
| `fecha_nacimiento` | DATE | Fecha de nacimiento (opcional) |
| `genero` | tipo_genero | Género |
| `telefono` | VARCHAR(20) | Teléfono (opcional) |
| `email` | VARCHAR(100) | Email (opcional) |

---

**`persona_rol`**
Roles que tiene una persona (puede tener múltiples a lo largo del tiempo).

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id_persona_rol` | INT PK | Identificador |
| `id_persona` | INT FK → persona | Persona |
| `rol` | tipo_rol_persona | Rol (JUGADOR, ARBITRO, etc.) |
| `fecha_desde` | DATE | Inicio del rol |
| `fecha_hasta` | DATE | Fin del rol (NULL = activo) |

---

**`fichaje_rol`**
Vinculación de una persona (en un rol específico) con un club por un período.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id_fichaje_rol` | INT PK | Identificador |
| `id_persona` | INT FK → persona | Persona fichada |
| `id_club` | INT FK → club | Club al que se ficha |
| `id_persona_rol` | INT FK → persona_rol | Rol habilitante |
| `rol` | tipo_rol_persona | Rol en este fichaje |
| `fecha_inicio` | DATE | Inicio del fichaje |
| `fecha_fin` | DATE | Fin del fichaje (NULL = activo) |
| `activo` | BOOLEAN | Estado del fichaje |

Restricciones: una persona no puede tener el mismo rol activo en dos clubes distintos, ni duplicar el mismo rol activo en el mismo club.

---

**`plantel`**
Grupo de integrantes de un equipo en una temporada. Solo puede haber un plantel activo por equipo a la vez.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id_plantel` | INT PK | Identificador |
| `id_equipo` | INT FK → equipo | Equipo |
| `nombre` | VARCHAR(100) | Nombre del plantel |
| `temporada` | VARCHAR(10) | Ej: `2024` o `2024-2025` |
| `fecha_apertura` | DATE | Fecha de apertura |
| `fecha_cierre` | DATE | Fecha de cierre (NULL = abierto) |
| `activo` | BOOLEAN | Estado del plantel |

Restricción: solo un plantel activo por equipo (índice parcial).

---

**`plantel_integrante`**
Vincula a una persona con un plantel en un rol y número de camiseta.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id_plantel_integrante` | INT PK | Identificador |
| `id_plantel` | INT FK → plantel | Plantel |
| `id_persona` | INT FK → persona | Persona |
| `id_fichaje_rol` | INT FK → fichaje_rol | Fichaje que habilita (opcional) |
| `rol_en_plantel` | tipo_rol_persona | Rol dentro del plantel |
| `numero_camiseta` | INT | Número de camiseta (opcional) |
| `fecha_alta` | DATE | Ingreso al plantel |
| `fecha_baja` | DATE | Baja del plantel (NULL = activo) |

Restricción: `(id_plantel, id_persona)` únicos.

---

**`torneo`**
Competencia oficial en la que participan equipos.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id_torneo` | INT PK | Identificador |
| `nombre` | VARCHAR(100) | Nombre del torneo |
| `categoria` | tipo_categoria | Categoría |
| `division` | VARCHAR(30) | División (opcional) |
| `genero` | tipo_genero | Género |
| `tipo` | tipo_torneo | Tipo de competencia: `LIGA`, `PLAYOFF`, `COPA` (default: `LIGA`) |
| `fecha_inicio` | DATE | Inicio del torneo |
| `fecha_fin` | DATE | Fin del torneo (opcional) |
| `activo` | BOOLEAN | Si el torneo está en curso |

---

**`inscripcion_torneo`**
Inscripción de un equipo en un torneo. Es la tabla de unión entre ambos y se usa como referencia en los partidos (en lugar de referenciar directamente al equipo).

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id_inscripcion` | INT PK | Identificador |
| `id_equipo` | INT FK → equipo | Equipo inscripto |
| `id_torneo` | INT FK → torneo | Torneo |
| `fecha_inscripcion` | DATE | Fecha de inscripción |
| `fecha_baja` | TIMESTAMP | Baja de la inscripción (NULL = activa) |

Restricción: `(id_equipo, id_torneo)` únicos.

---

**`fase`**
Etapa dentro de un torneo (liga, grupos, eliminación).

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id_fase` | INT PK | Identificador |
| `id_torneo` | INT FK → torneo | Torneo |
| `nombre` | VARCHAR(50) | Nombre de la fase |
| `tipo` | tipo_fase | Tipo (LIGA, GRUPOS, ELIMINACION) |
| `orden` | INT | Orden de la fase en el torneo |
| `fecha_inicio` | DATE | Inicio (opcional) |
| `fecha_fin` | DATE | Fin (opcional) |

---

**`partido`**
Registro de un partido jugado entre dos equipos inscriptos en un torneo.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id_partido` | INT PK | Identificador |
| `id_torneo` | INT FK → torneo | Torneo |
| `id_fase` | INT FK → fase | Fase (opcional) |
| `fecha` | DATE | Fecha del partido |
| `horario` | TIME | Horario (opcional) |
| `id_inscripcion_local` | INT FK → inscripcion_torneo | Equipo local |
| `id_inscripcion_visitante` | INT FK → inscripcion_torneo | Equipo visitante |
| `id_arbitro1` | INT FK → persona | Árbitro principal (opcional) |
| `id_arbitro2` | INT FK → persona | Árbitro secundario (opcional) |
| `id_capitan_local` | INT FK → plantel_integrante | Capitán local (opcional) |
| `id_capitan_visitante` | INT FK → plantel_integrante | Capitán visitante (opcional) |
| `ubicacion` | VARCHAR(200) | Cancha (opcional) |
| `numero_fecha` | INT | Número de jornada (opcional) |
| `estado_partido` | tipo_estado_partido | Estado del partido |
| `goles_local_manual` | INT | Resultado manual (para categorías sin desglose) |
| `goles_visitante_manual` | INT | Resultado manual |

Restricción: no puede haber dos partidos entre los mismos equipos en la misma fecha y torneo (índice único sobre `LEAST`/`GREATEST` de inscripciones).

---

**`participan_partido`**
Jugadores y participantes que estuvieron en un partido.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id_participante_partido` | INT PK | Identificador |
| `id_partido` | INT FK → partido | Partido |
| `id_plantel_integrante` | INT FK → plantel_integrante | Integrante del plantel |
| `numero_camiseta` | INT | Número de camiseta usado en este partido |

Restricción: `(id_partido, id_plantel_integrante)` únicos.

---

**`gol`**
Gol registrado en un partido, ligado al participante que lo convirtió.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id_gol` | INT PK | Identificador |
| `id_partido` | INT FK → partido | Partido |
| `id_participante_partido` | INT FK → participan_partido | Jugador que convirtió |
| `minuto` | INT | Minuto (opcional) |
| `cuarto` | INT (1-4) | Cuarto de juego (opcional) |
| `referencia_gol` | tipo_gol | Tipo: GJ, GC, GP, DP |
| `es_autogol` | BOOLEAN | Si fue autogol |
| `estado_gol` | tipo_estado_gol | VALIDO, ANULADO, CORREGIDO |
| `motivo_anulacion` | VARCHAR(500) | Motivo si fue anulado |

---

**`tarjeta`**
Tarjeta disciplinaria recibida por un participante en un partido.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id_tarjeta` | INT PK | Identificador |
| `id_partido` | INT FK → partido | Partido |
| `id_participante_partido` | INT FK → participan_partido | Jugador sancionado |
| `tipo` | tipo_tarjeta | VERDE, AMARILLA, ROJA |
| `minuto` | INT | Minuto (opcional) |
| `cuarto` | INT (1-4) | Cuarto (opcional) |
| `estado_tarjeta` | tipo_estado_tarjeta | VALIDA, ANULADA, CORREGIDA |
| `revisada` | BOOLEAN | Si fue revisada/apelada |

---

**`suspension`**
Sanción que impide a una persona participar en partidos futuros.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id_suspension` | INT PK | Identificador |
| `id_persona_rol` | INT FK → persona_rol | Persona y rol sancionado |
| `id_torneo` | INT FK → torneo | Torneo donde aplica |
| `id_partido_origen` | INT FK → partido | Partido que originó la sanción |
| `tipo_suspension` | tipo_suspension | POR_PARTIDOS o POR_FECHA |
| `motivo` | VARCHAR(500) | Motivo de la sanción |
| `fechas_suspension` | INT | Cantidad de partidos (si es POR_PARTIDOS) |
| `fecha_fin_suspension` | DATE | Fecha límite (si es POR_FECHA) |
| `cumplidas` | INT | Partidos cumplidos |
| `partidos_cumplidos` | INT[] | Array con IDs de partidos cumplidos |
| `estado_suspension` | tipo_estado_suspension | ACTIVA, CUMPLIDA, ANULADA |

---

**`posicion`**
Estadísticas de un equipo en un torneo (tabla de posiciones). Se actualiza al cargar planillas.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id_posicion` | INT PK | Identificador |
| `id_torneo` | INT FK → torneo | Torneo |
| `id_equipo` | INT FK → equipo | Equipo |
| `puntos` | INT | Puntos acumulados |
| `partidos_jugados` | INT | PJ |
| `ganados` | INT | Ganados |
| `empatados` | INT | Empatados |
| `perdidos` | INT | Perdidos |
| `goles_a_favor` | INT | GF |
| `goles_en_contra` | INT | GC |
| `diferencia_gol` | INT (generado) | GF - GC (columna calculada en la BD) |

---

**`fixture_fecha`**
Agrupación lógica de jornadas dentro de un torneo. Almacena el número de fecha y, si hay número impar de equipos, qué equipo descansa en esa jornada.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id_fixture_fecha` | INT PK | Identificador |
| `id_torneo` | INT FK → torneo | Torneo |
| `numero_fecha` | INT | Número de la jornada |
| `rueda` | VARCHAR(20) | Rueda: `ida` o `vuelta` |
| `id_equipo_descansa` | INT FK → equipo | Equipo que descansa (NULL si número par de equipos) |
| `creado_en` | TIMESTAMP | Fecha de creación |
| `creado_por` | VARCHAR(100) | Usuario que creó |
| `actualizado_en` | TIMESTAMP | Última actualización |
| `actualizado_por` | VARCHAR(100) | Usuario que actualizó |

---

**`fixture_playoff_ronda`**
Ronda de un bracket de playoff (Final, Semifinal, Cuartos, etc.). Agrupa los partidos de cada eliminatoria.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id_fixture_playoff_ronda` | INT PK | Identificador |
| `id_torneo` | INT FK → torneo | Torneo |
| `nombre` | VARCHAR(100) | Nombre de la ronda (ej: "Semifinal", "Final") |
| `orden` | INT | Orden dentro del bracket (1 = primera ronda) |
| `ida_y_vuelta` | BOOLEAN | Si la ronda se juega a ida y vuelta |
| `creado_en` | TIMESTAMP | Fecha de creación |
| `creado_por` | VARCHAR(100) | Usuario que creó |

Restricción: `(id_torneo, orden)` únicos.

---

**`fixture_partido`**
Partido programado (fixture) antes de jugarse. Al cargarse la planilla real queda vinculado a `partido`. Para partidos de playoff con equipos aún no definidos, `id_equipo_local`/`id_equipo_visitante` son NULL y se usan los campos `placeholder_*`.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id_fixture_partido` | INT PK | Identificador |
| `id_torneo` | INT FK → torneo | Torneo |
| `id_equipo_local` | INT FK → equipo (nullable) | Equipo local (NULL en playoff hasta definirse) |
| `id_equipo_visitante` | INT FK → equipo (nullable) | Equipo visitante (NULL en playoff hasta definirse) |
| `id_fixture_fecha` | INT FK → fixture_fecha | Jornada a la que pertenece (NULL en playoff) |
| `id_fixture_playoff_ronda` | INT FK → fixture_playoff_ronda | Ronda de playoff (NULL en fixture de liga) |
| `placeholder_local` | VARCHAR(100) | Ej: "Ganador SF1" mientras no hay equipo definido |
| `placeholder_visitante` | VARCHAR(100) | Ej: "Ganador SF2" |
| `fecha_programada` | DATE | Fecha programada (opcional, asignada manualmente) |
| `horario` | TIME | Horario (opcional) |
| `ubicacion` | VARCHAR(200) | Lugar (opcional) |
| `numero_fecha` | INT | Jornada (copia desnormalizada) |
| `estado` | tipo_estado_partido | Estado del partido de fixture |
| `id_partido_real` | INT FK → partido | Partido real (NULL hasta que se cargue la planilla) |
| `creado_en` | TIMESTAMP | Fecha de creación |
| `creado_por` | VARCHAR(100) | Usuario que creó |
| `actualizado_por` | VARCHAR(100) | Usuario que actualizó |

**Estados de `fixture_partido`:**

| Estado | Visible al público | Descripción |
|--------|-------------------|-------------|
| `BORRADOR` | No | Creado automáticamente por el generador. Sin fecha asignada. |
| `PENDIENTE` | Sí | Tiene fecha asignada. Se muestra en el fixture público. |
| `TERMINADO` | Sí | Partido jugado y planilla cargada. |
| `SUSPENDIDO` | Sí | Partido suspendido. |
| `REPROGRAMADO` | Sí | Partido reprogramado. |
| `ANULADO` | No (en fixture) | Partido anulado. |

> **Transición automática**: cuando se asigna una `fecha_programada` a un partido en estado `BORRADOR`, el backend lo pasa automáticamente a `PENDIENTE`. Si se quita la fecha de un `PENDIENTE`, vuelve a `BORRADOR`.

---

**`usuario`**
Usuario del sistema con acceso al panel administrativo.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id_usuario` | INT PK | Identificador |
| `username` | VARCHAR(50) UNIQUE | Nombre de usuario |
| `email` | VARCHAR(100) UNIQUE | Email |
| `password_hash` | TEXT | Contraseña hasheada (argon2) |
| `tipo` | tipo_usuario | Rol: SUPERUSUARIO, ADMIN, EDITOR, LECTOR |
| `activo` | BOOLEAN | Si puede iniciar sesión |
| `intentos_fallidos` | INT | Intentos de login fallidos |
| `bloqueado_hasta` | TIMESTAMP | Bloqueo temporal por intentos |
| `ultimo_login` | TIMESTAMP | Último acceso |

---

**`refresh_token`**
Tokens de sesión de larga duración para renovar el access token sin re-login.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id_refresh_token` | INT PK | Identificador |
| `id_usuario` | INT FK → usuario | Usuario |
| `token_hash` | TEXT | Hash del token (no se guarda el token en texto plano) |
| `expires_at` | TIMESTAMP | Expiración |
| `revoked` | BOOLEAN | Si fue revocado |
| `created_by_ip` | INET | IP de creación |
| `user_agent` | TEXT | User-agent del cliente |

---

**`noticias`**
Entradas de contenido publicables en el sitio.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id_noticia` | INT PK | Identificador |
| `titulo` | VARCHAR(255) | Título |
| `imagen_url` | TEXT | URL de imagen (opcional) |
| `epigrafe` | VARCHAR(255) | Epígrafe/bajada (opcional) |
| `texto` | TEXT | Cuerpo de la noticia |
| `url_externa` | TEXT | URL de referencia externa (opcional) |

---

### Vistas SQL

La tabla de posiciones se consulta desde una vista SQL (`006_views.sql`) que agrega los resultados de partidos en estado `TERMINADO`. No requiere actualización manual; se recalcula en cada consulta.

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
| Método | Ruta | Descripción | Rol mínimo |
|--------|------|-------------|-----------|
| GET | `/proximos` | Próximos partidos públicos (PENDIENTE, SUSPENDIDO, REPROGRAMADO) | Público |
| GET | `/torneo/{id}` | Fixture de un torneo (solo estados visibles) | Público |
| GET | `/admin/torneo/{id}` | Fixture de un torneo (todos los estados, incluye BORRADOR) | Editor |
| GET | `/{id}` | Detalle de un partido de fixture | Público |
| POST | `/` | Programar partido manual | Editor |
| POST | `/preview/{id_torneo}` | Previsualizar fixture automático (sin guardar) | Editor |
| POST | `/generar/{id_torneo}` | Generar y guardar fixture automático (round-robin) | Editor |
| PUT | `/{id}` | Editar partido de fixture | Editor |
| DELETE | `/{id}` | Eliminar un partido de fixture | Editor |
| DELETE | `/torneo/{id_torneo}` | Eliminar todo el fixture de un torneo | Editor |
| GET | `/playoff/rondas/{id_torneo}` | Listar rondas de un playoff | Editor |
| POST | `/playoff/rondas/{id_torneo}` | Crear ronda de playoff manualmente | Editor |
| POST | `/playoff/preview/{id_torneo}` | Previsualizar bracket de playoff (sin guardar) | Editor |
| POST | `/playoff/generar/{id_torneo}` | Generar y guardar bracket de playoff | Editor |

> **Importante:** el orden de las rutas en FastAPI es relevante. Las rutas literales (`/proximos`, `/admin/torneo/{id}`, `/torneo/{id}`, `/preview/{id}`, `/generar/{id}`) deben registrarse **antes** de la ruta paramétrica `/{id}` para evitar que FastAPI trate cadenas como "torneo" como un ID entero.

**Tipos de fixture (`tipo`):**

| Valor | Descripción |
|-------|-------------|
| `simple` | Todos contra todos una sola vez (round-robin ida) |
| `ida_y_vuelta` | Vuelta espejo exacto de la ida, mismos enfrentamientos con local/visitante invertidos |
| `ida_y_vuelta_aleatorio` | Vuelta con orden de fechas aleatorio; se garantiza que la primera fecha de vuelta no repita los enfrentamientos de la última de ida |

El campo `rueda` (`"ida"` o `"vuelta"`) se almacena en `fixture_fecha` y se expone en el response de cada `fixture_partido`. Para torneos sin generación automática (programados manualmente) el campo es `null`.

**Generación automática de fixture (round-robin):**

1. El frontend llama a `POST /preview/{id_torneo}` con `{ tipo: "simple" | "ida_y_vuelta" | "ida_y_vuelta_aleatorio" }`.
2. El backend devuelve `FixturePreviewResponse` con todos los partidos y descansos por fecha, sin guardar nada.
3. El usuario revisa el preview y confirma.
4. El frontend llama a `POST /generar/{id_torneo}` con el mismo tipo.
5. El backend guarda `fixture_fecha` y `fixture_partido` en estado `BORRADOR`.
6. Si ya existía fixture para ese torneo, se elimina primero (incluyendo partidos jugados si los hay — el sistema avisa al frontend).

**Generación de bracket de playoff:**

Disponible para torneos de tipo `PLAYOFF` o `COPA`. Genera un cuadro de eliminación directa a partir de los equipos inscriptos.

Parámetros (`GenerarPlayoffRequest`):

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `formato` | `"ida"` \| `"ida_y_vuelta"` | Si cada serie se juega a ida o ida y vuelta |
| `asignacion` | `"automatico"` \| `"manual"` | Cómo se asignan los cruces |
| `duelos` | lista (opcional) | Pares `{id_equipo_local, id_equipo_visitante}` para la primera ronda (solo para `asignacion: "manual"`) |

Algoritmo:
- Se calculan las rondas necesarias según la cantidad de equipos (potencia de 2 superior).
- Si el número de equipos no es potencia de 2, se agrega una ronda de Repechaje donde los equipos "extra" juegan entre sí; los restantes tienen BYE (avanzan directamente).
- Las rondas posteriores se crean con `placeholder_local` / `placeholder_visitante` (ej: `"Ganador SF1"`) sin equipos asignados.
- Cuando se carga la planilla de un partido y queda en estado `TERMINADO`, el backend identifica automáticamente al ganador y reemplaza el placeholder correspondiente en la siguiente ronda (`avanzar_ganador`).

Nombres de ronda según cantidad de partidos: `Repechaje`, `Octavos de Final`, `Cuartos de Final`, `Semifinal`, `Final`.

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

### Historial de migraciones

| Versión | Descripción |
|---------|-------------|
| `0001` – `0012` | Migraciones iniciales: tablas base, auditoría, fixture básico |
| `0013` | Mejoras de fixture: agrega `PENDIENTE` al enum `tipo_estado_partido`; columna `actualizado_por` en `fixture_partido`; columnas `actualizado_en`, `actualizado_por` e `id_equipo_descansa` en `fixture_fecha`; FK `fixture_fecha → equipo` para el equipo que descansa |
| `0014` | Tipo de torneo: crea enum `tipo_torneo` (`LIGA`, `PLAYOFF`, `COPA`) y agrega columna `tipo` en tabla `torneo` (default `LIGA`) |
| `0015` | Sistema de playoff: crea tabla `fixture_playoff_ronda`; agrega en `fixture_partido` las columnas `id_fixture_playoff_ronda` (FK), `placeholder_local`, `placeholder_visitante`; hace nullable `id_equipo_local` e `id_equipo_visitante`; actualiza constraint de equipos distintos para permitir NULLs |

### Aplicar migraciones en producción (VPS)

```bash
# 1. Subir los cambios al servidor (git pull o scp)
# 2. Reconstruir e iniciar los contenedores
docker compose up --build -d

# 3. Aplicar migraciones pendientes
docker compose exec api alembic upgrade head

# 4. Verificar
docker compose exec api alembic current
```

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

Los scripts en `backups/` gestionan el backup y restauración de la base de datos. Generan archivos `.dump` (formato binario de PostgreSQL, más eficiente que SQL plano).

### Scripts disponibles

| Script | Uso |
|--------|-----|
| `backup_hockey.sh` | Genera un backup y opcionalmente lo sube a Google Drive |
| `restore_hockey.sh` | Restaura la base desde un archivo `.dump` |

Ambos scripts reciben un argumento de entorno (`local` o `vps`) y leen su configuración desde un archivo `backups/.env.<entorno>`.

### Archivo de configuración por entorno

Crear `backups/.env.local` y/o `backups/.env.vps` con:

```env
DB_NAME=hockey
DB_USER=hockey_user
CONTAINER_NAME=hockey_db
BACKUP_PATH=/ruta/donde/guardar/los/dumps
```

### Hacer un backup manualmente

```bash
# En entorno local
./backups/backup_hockey.sh local

# En el VPS
./backups/backup_hockey.sh vps
```

El archivo generado tiene el formato: `backup_hockey_YYYY-MM-DD_HH-MM-SS.dump`

En el entorno `vps`, además de guardar el archivo localmente:
- Lo sube a **Google Drive** usando `rclone` (carpeta `backups/hockey`)
- Elimina de Drive los backups con más de 30 días
- Elimina del disco local los backups con más de 30 días

### Restaurar desde un backup

```bash
# En entorno local
./backups/restore_hockey.sh local /ruta/al/archivo.dump

# En el VPS
./backups/restore_hockey.sh vps /ruta/al/archivo.dump
```

> **Atención:** la restauración usa `--clean --if-exists`, lo que elimina y recrea las tablas antes de restaurar. No ejecutar en producción sin confirmar primero.

### Backup automático en el VPS

El backup automático está configurado como un cron job en el VPS que ejecuta el script a la **1:00 AM**. Para verificarlo o editarlo:

```bash
crontab -l          # Ver cron jobs activos
crontab -e          # Editar
```

La línea configurada en el VPS es:

```
0 1 * * * /root/proyectos/pagina-hockey-bariloche/backups/backup_hockey.sh vps >> /root/proyectos/backups/backup.log 2>&1
```

El log se guarda en `/root/proyectos/backups/backup.log`.

### Dependencia: rclone

El script de VPS requiere `rclone` instalado y configurado con acceso a Google Drive. Para verificar:

```bash
rclone listremotes        # Debe aparecer "drive:"
rclone ls drive:backups/hockey   # Lista los backups en Drive
```

Si `rclone` no está configurado, seguir la [guía oficial de rclone con Google Drive](https://rclone.org/drive/).

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
