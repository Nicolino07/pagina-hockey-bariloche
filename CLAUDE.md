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

## Comandos útiles
- Levantar proyecto: docker compose up 
- Levantar proyecto + cambios: docker compose up --build
- bajar proyecto: docker compose down
- bajar proyecto + limpieza de contenedores: docker compose down -v
