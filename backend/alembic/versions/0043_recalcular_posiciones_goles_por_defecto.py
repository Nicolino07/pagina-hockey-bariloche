"""Recalcular `posicion` tras el cambio de fórmula de la migración 0025

La 0025 arregló `vw_resultado_partido` para que sumara los goles por defecto
(walkover), que hasta entonces se perdían y dejaban esos partidos como 0-0.
Pero `posicion` no es una vista: es una tabla materializada que mantienen dos
triggers, y cambiar la fórmula no reescribe lo que ya estaba guardado. Las
tablas calculadas ANTES de la 0025 quedaron con los números viejos.

En la base de desarrollo el desvío eran 2 filas de un solo torneo — el único
partido con goles por defecto de toda la base:

    Torneo 8 · APERTURA
      Estudiantes      GF 14→18   DG 13→17
      Independiente B  GC 20→24   DG -19→-23

Los puntos y los partidos jugados no cambian, así que el orden de la tabla no
se mueve; lo que estaba mal era la diferencia de gol. En producción puede haber
más walkovers, así que esto **no** repara un torneo puntual: recalcula todos y
deja cada tabla igual a lo que dice la fórmula vigente.

Es idempotente: `recalcular_tabla_posiciones` resetea a cero y vuelve a sumar
desde los partidos terminados, así que correrlo de más no hace daño.

Va después de la 0042 a propósito: para entonces los playoffs ya no tienen
filas de `posicion`, así que el recálculo no puede devolverles puntos.

Revision ID: 0043
Revises: 0042
Create Date: 2026-08-29
"""
from alembic import op

revision = '0043'
down_revision = '0042'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        DO $$
        DECLARE v_id INT;
        BEGIN
            FOR v_id IN SELECT id_torneo FROM torneo LOOP
                PERFORM recalcular_tabla_posiciones(v_id);
            END LOOP;
        END $$;
    """)


def downgrade() -> None:
    # No hay vuelta atrás posible ni deseable: los valores anteriores eran el
    # resultado de una fórmula que la 0025 declaró incorrecta. Volver a
    # calcularlos exigiría revertir también esa vista, que es lo que hace el
    # downgrade de la 0025.
    pass
