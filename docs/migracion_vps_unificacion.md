# Runbook — Migración a producción (VPS): unificación partido/fixture

Migra el esquema a la unificación `partido`/`fixture_partido` (una sola tabla
`partido`) + designación de árbitros. Son las migraciones Alembic **0021 → 0026**.

## Qué hacen las migraciones

| Rev | Qué hace |
|-----|----------|
| 0021 | Rol `ADMIN_ARBITROS`, `torneo.es_competitiva`, funciones + trigger de designación de árbitros |
| 0022 | Columnas del fixture en `partido` (equipos, placeholders, agrupación); inscripción nullable; backfill de los partidos existentes |
| 0023 | Materializa los fixtures **programados** (no jugados) como `partido`; **descarta** fixtures TERMINADO sin partido (datos erróneos) |
| 0024 | Regla de "club propio" por `id_equipo` (para que árbitros funcione sobre programados) |
| 0025 | Fix `vw_resultado_partido`: suma `goles_por_defecto` (walkover contaba como empate) |
| 0026 | **`DROP TABLE fixture_partido`** |

El código nuevo lee y escribe todo sobre `partido`; `fixture_fecha` y
`fixture_playoff_ronda` quedan como agrupación del calendario.

## Cómo se aplican en el VPS

El `entrypoint.sh` del backend detecta que la DB **ya existe** (tiene
`alembic_version`) y corre `alembic upgrade head`. Así que al desplegar el código
nuevo y levantar el contenedor, las migraciones 0021→0026 se aplican solas sobre
la DB de prod (que está en 0020).

> Recordá el esquema dual: `db/init` (instalación desde cero) y Alembic (DBs
> existentes) ya están sincronizados. En el VPS aplica **Alembic** (la DB existe).

---

## Paso 0 — Dry-run local con datos del VPS (OBLIGATORIO antes de prod)

Esto es lo que ya planeaste y es lo correcto: probar la migración con los **datos
reales del VPS** antes de tocar prod.

1. Restaurar el backup del VPS en local (script `backups/restore_hockey.sh`; pide
   la passphrase GPG).
2. **Antes de migrar**, anotar conteos de referencia:
   ```sql
   SELECT (SELECT count(*) FROM partido)            AS partidos,
          (SELECT count(*) FROM fixture_partido)    AS fixtures,
          (SELECT coalesce(sum(puntos),0) FROM posicion) AS puntos,
          (SELECT count(*) FROM gol)                AS goles,
          (SELECT count(*) FROM tarjeta)            AS tarjetas;
   -- Fixtures "basura" (TERMINADO sin partido) que la 0023 descarta:
   SELECT count(*) FROM fixture_partido WHERE estado='TERMINADO' AND id_partido_real IS NULL;
   ```
3. Levantar con el **código nuevo**: `docker compose up --build`. El entrypoint
   corre `alembic upgrade head`. Verificar en el log que llega a **0026**.
4. **Verificar** post-migración (ver "Checklist de verificación" abajo).
5. Probar en el navegador el ciclo completo: generar fixture, designar árbitros,
   cargar resultado, otorgar puntos, playoff con avance de ganador, resultados y
   posiciones públicas.
6. Si algo falla, se ajusta el código/migración **acá**, no en prod.

## Paso 1 — Backup del VPS ANTES de migrar

```bash
# En el VPS: backup cifrado (script existente)
./backups/backup_hockey.sh
```
Confirmar que el `.sql.gpg` quedó bien y es restaurable. **No migrar sin esto.**

## Paso 2 — Desplegar y migrar

1. `git pull` de la rama ya mergeada (o el tag de release).
2. Levantar backend con build:
   ```bash
   docker compose up -d --build api
   ```
3. Mirar el log del entrypoint: debe decir
   `DB existente — aplicando migraciones pendientes (upgrade head)` y correr
   `0020 → 0021 → ... → 0026` sin errores.

## Paso 3 — Verificación

Checklist:
- `SELECT version_num FROM alembic_version;` → **0026**.
- `SELECT count(*) FROM information_schema.tables WHERE table_name='fixture_partido';` → **0**.
- Conteos vs. paso 0: `partido`, `posicion`, `gol`, `tarjeta` coherentes.
  - `partido` **aumenta** en la cantidad de fixtures **programados** materializados.
  - Los fixtures "basura" TERMINADO-sin-partido **no** se materializan (desaparecen
    con el drop). Confirmar que ese número coincide con lo visto en el dry-run.
- Endpoints: `/api/fixture/proximos`, `/api/fixture/torneo/<id>`,
  `/api/partidos/recientes`, `/api/torneos/` → 200.
- Navegador: fixture, resultados, posiciones y un playoff se ven bien.

## Paso 4 — (Opcional) Corregir walkovers históricos

La 0025 arregla que los walkovers ("otorgar puntos") cuenten bien, pero las
posiciones **ya guardadas** no cambian hasta recalcular. Si hay torneos con
partidos otorgados por puntos y querés que la tabla los refleje:

```sql
-- Torneos con walkovers:
SELECT DISTINCT id_torneo FROM partido
WHERE goles_por_defecto_local IS NOT NULL OR goles_por_defecto_visitante IS NOT NULL;
-- Recalcular cada uno (cambia posiciones históricas de esos torneos):
SELECT recalcular_tabla_posiciones(<id_torneo>);
```
Decidir caso por caso: recalcular corrige la tabla pero **cambia standings viejos**.

## Rollback

Si la migración falla o algo anda mal en prod:
1. Bajar el backend.
2. Restaurar el backup del Paso 1 (`restore_hockey.sh`).
3. Revertir el código a la versión anterior (0020) y levantar.

> Nota: `alembic downgrade` existe (0026→0021 tienen `downgrade`), pero el drop de
> `fixture_partido` **no restaura los datos** de esa tabla (ya viven en `partido`).
> Para volver atrás en serio, usar el **backup**, no el downgrade.

## Notas

- La lógica de la 0023 (materializar programados / descartar TERMINADO-sin-partido)
  es agnóstica de los datos: funciona con lo que haya en el VPS. El dry-run
  confirma que no hay anomalías raras propias de prod.
- Ver deuda pendiente en `CLAUDE.md` (vista muerta `vw_fixture_partidos`, schemas
  `FixturePartido*`, marcador duplicado en dos vistas).
