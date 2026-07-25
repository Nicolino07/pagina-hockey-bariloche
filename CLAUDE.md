# Sistema deportivo Hockey Pista

## Descripción
Sistema de gestión para torneos de hockey sobre pista.

- Resultados, goles, tarjetas y sanciones
- Tabla de posiciones automática
- Fixture por categoría (a implementar)
- Sección de noticias
- Exportación a Excel/PDF
- Sitio público + panel administrativo

## Stack
- **Backend:** Python 3.x, FastAPI, PostgreSQL
- **Frontend:** TypeScript, React
- **Otros:** Docker, SQLAlchemy.

## Estructura del proyecto
El proyecto se organiza en dos grandes carpetas, backend y frontend. 
Dentro de backend tenemos models/ routers/ schemas/ 
Dentro de Front las apis, paginas publicas y administratibas mas login.

- `/backend` - API FastAPI
- `/frontend` - App React
- Leer `Arbol_repositorio.txt` en la raíz para entender la estructura completa del proyecto

## Convenciones
- **Backend:** PEP8, docstrings en español, type hints obligatorios
- **Frontend:** camelCase para variables/funciones, PascalCase para componentes React
- **API:** respuestas en español, nombres de endpoints en inglés

## Deuda técnica conocida
- Falta documentación en funciones y endpoints
- Bugs visuales pendientes: [listá cuáles si los conocés]
- Fixture por categoría sin implementar

### Post-unificación partido/fixture (limpieza pendiente, no urgente)
- **Vista muerta `vw_fixture_partidos`** (`db/init/006_views.sql`): ya no la usa
  nadie (solo aparece en grants). Lee de `partido`, así que no rompe nada; se puede
  borrar (vista + su grant en `007_grants.sql`).
- **Schemas `FixturePartido*`** (`app/schemas/fixture_partido.py`:
  `FixturePartidoResponse/Create/Update/Preview`): siguen siendo el **contrato del
  fixture** (no son el modelo, que ya no existe). Funcionan bien; el nombre quedó
  histórico. Renombrarlos a algo como `FixturePartido*` → `PartidoProgramado*` sería
  más claro, pero implica tocar router + frontend. Opcional.
- **Marcador duplicado**: la fórmula del resultado vive en `vw_resultado_partido`
  (posiciones) y `vw_partidos_detallados` (display). Ya se desincronizaron una vez
  (ver migración 0025). Idealmente consolidar en una sola vista canónica. Ver
  runbook y memoria del proyecto.

## Comandos útiles
- Levantar proyecto: docker compose up 
- Levantar proyecto + cambios: docker compose up --build
- bajar proyecto: docker compose down
- bajar proyecto + limpieza de contenedores: docker compose down -v
