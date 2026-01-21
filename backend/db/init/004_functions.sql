-- =====================================================
-- 004_functions.sql
-- Funciones del sistema (dominio y soporte)
-- =====================================================

BEGIN;

-- =====================================================
-- 1. TIMESTAMP AUTOMÁTICO
-- =====================================================

CREATE OR REPLACE FUNCTION fn_set_actualizado_en()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- =====================================================
-- 2. VALIDAR ROL EN PLANTEL
-- =====================================================
-- Una persona solo puede cumplir un rol en un plantel
-- si tiene ese rol habilitado en persona_rol y vigente
-- =====================================================

CREATE OR REPLACE FUNCTION fn_validar_rol_en_plantel()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM persona_rol pr
        WHERE pr.id_persona = NEW.id_persona
          AND pr.rol = NEW.rol_en_plantel
          AND (pr.fecha_hasta IS NULL OR pr.fecha_hasta >= NEW.fecha_alta)
    ) THEN
        RAISE EXCEPTION
            'La persona % no está habilitada para el rol %',
            NEW.id_persona, NEW.rol_en_plantel;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- =====================================================
-- 3. VALIDAR CAPITANES
-- =====================================================
-- Un capitán debe ser jugador
-- =====================================================

CREATE OR REPLACE FUNCTION fn_validar_capitanes()
RETURNS TRIGGER AS $$
DECLARE
    rol_local tipo_rol_persona;
    rol_visitante tipo_rol_persona;
BEGIN
    IF NEW.id_capitan_local IS NOT NULL THEN
        SELECT rol_en_plantel
        INTO rol_local
        FROM plantel_integrante
        WHERE id_plantel_integrante = NEW.id_capitan_local;

        IF rol_local <> 'JUGADOR' THEN
            RAISE EXCEPTION 'El capitán local debe ser jugador';
        END IF;
    END IF;

    IF NEW.id_capitan_visitante IS NOT NULL THEN
        SELECT rol_en_plantel
        INTO rol_visitante
        FROM plantel_integrante
        WHERE id_plantel_integrante = NEW.id_capitan_visitante;

        IF rol_visitante <> 'JUGADOR' THEN
            RAISE EXCEPTION 'El capitán visitante debe ser jugador';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- =====================================================
-- 4. VALIDAR QUE ÁRBITROS NO PARTICIPEN COMO JUGADORES
-- =====================================================

CREATE OR REPLACE FUNCTION fn_validar_arbitros_no_jugadores()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM participan_partido pp
        JOIN plantel_integrante pi
          ON pi.id_plantel_integrante = pp.id_plantel_integrante
        WHERE pp.id_partido = NEW.id_partido
          AND pi.id_persona IN (NEW.id_arbitro1, NEW.id_arbitro2)
    ) THEN
        RAISE EXCEPTION
            'Un árbitro no puede participar como jugador en el mismo partido';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- =====================================================
-- 5. FUNCIÓN UTILITARIA: PERSONA SUSPENDIDA
-- =====================================================
-- Devuelve TRUE si la persona está suspendida en el torneo
-- =====================================================

CREATE OR REPLACE FUNCTION fn_persona_suspendida(
    p_id_persona INT,
    p_id_torneo  INT,
    p_fecha      DATE
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM suspension s
        WHERE s.id_persona = p_id_persona
          AND s.id_torneo = p_id_torneo
          AND s.activa = TRUE
          AND (
              (s.tipo_suspension = 'POR_PARTIDOS'
               AND s.cumplidas < s.fechas_suspension)
           OR
              (s.tipo_suspension = 'POR_FECHA'
               AND p_fecha <= s.fecha_fin_suspension)
          )
    );
END;
$$ LANGUAGE plpgsql;


-- =====================================================
-- 6. RECALCULAR POSICIONES DE UN TORNEO
-- =====================================================

CREATE OR REPLACE FUNCTION recalcular_tabla_posiciones(p_id_torneo INT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    -- =========================
    -- 1️⃣ Reset tabla
    -- =========================
    UPDATE posicion
    SET puntos = 0,
        partidos_jugados = 0,
        ganados = 0,
        empatados = 0,
        perdidos = 0,
        goles_a_favor = 0,
        goles_en_contra = 0
    WHERE id_torneo = p_id_torneo;

    -- =========================
    -- 2️⃣ Recalcular desde partidos normalizados
    -- =========================
    UPDATE posicion pos
    SET
        partidos_jugados = pos.partidos_jugados + x.partidos_jugados,
        ganados           = pos.ganados           + x.ganados,
        empatados         = pos.empatados         + x.empatados,
        perdidos          = pos.perdidos          + x.perdidos,
        goles_a_favor     = pos.goles_a_favor     + x.goles_a_favor,
        goles_en_contra   = pos.goles_en_contra   + x.goles_en_contra,
        puntos            = pos.puntos            + x.puntos
    FROM (
        SELECT
            it.id_equipo,
            COUNT(*) AS partidos_jugados,
            SUM(CASE WHEN gf > gc THEN 1 ELSE 0 END) AS ganados,
            SUM(CASE WHEN gf = gc THEN 1 ELSE 0 END) AS empatados,
            SUM(CASE WHEN gf < gc THEN 1 ELSE 0 END) AS perdidos,
            SUM(gf) AS goles_a_favor,
            SUM(gc) AS goles_en_contra,
            SUM(
                CASE
                    WHEN gf > gc THEN 3
                    WHEN gf = gc THEN 1
                    ELSE 0
                END
            ) AS puntos
        FROM (
            -- LOCAL
            SELECT
                p.id_torneo,
                p.id_inscripcion_local   AS id_inscripcion,
                r.goles_local            AS gf,
                r.goles_visitante        AS gc
            FROM vw_resultado_partido r
            JOIN partido p ON p.id_partido = r.id_partido
            WHERE p.estado_partido = 'TERMINADO'

            UNION ALL

            -- VISITANTE
            SELECT
                p.id_torneo,
                p.id_inscripcion_visitante AS id_inscripcion,
                r.goles_visitante          AS gf,
                r.goles_local              AS gc
            FROM vw_resultado_partido r
            JOIN partido p ON p.id_partido = r.id_partido
            WHERE p.estado_partido = 'TERMINADO'
        ) partidos
        JOIN inscripcion_torneo it
          ON it.id_inscripcion = partidos.id_inscripcion
        WHERE partidos.id_torneo = p_id_torneo
        GROUP BY it.id_equipo
    ) x
    WHERE pos.id_torneo = p_id_torneo
      AND pos.id_equipo = x.id_equipo;
END;
$$;



CREATE OR REPLACE FUNCTION fn_recalcular_posiciones()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- SOLO cuando pasa a TERMINADO
    IF TG_OP = 'UPDATE'
       AND OLD.estado_partido IS DISTINCT FROM 'TERMINADO'
       AND NEW.estado_partido = 'TERMINADO' THEN

        PERFORM recalcular_tabla_posiciones(NEW.id_torneo);

    END IF;

    RETURN NEW;
END;
$$;

-- =================================================
-- Prohibe goles sin partido TERMINADO
-- =================================================

CREATE OR REPLACE FUNCTION fn_validar_gol_partido()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM partido
        WHERE id_partido = NEW.id_partido
          AND estado_partido IN ('TERMINADO')
    ) THEN
        RAISE EXCEPTION 'No se pueden cargar goles en un partido no iniciado';
    END IF;

    RETURN NEW;
END;
$$;

-- ====================================================
-- Inicializa tabla de posiciones en 0
-- ====================================================
CREATE OR REPLACE FUNCTION fn_init_posicion_por_inscripcion()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO posicion (
        id_torneo,
        id_equipo,
        puntos,
        partidos_jugados,
        ganados,
        empatados,
        perdidos,
        goles_a_favor,
        goles_en_contra
    )
    VALUES (
        NEW.id_torneo,
        NEW.id_equipo,
        0, 0, 0, 0, 0, 0, 0
    )
    ON CONFLICT (id_torneo, id_equipo) DO NOTHING;

    RETURN NEW;
END;
$$;

-- =====================================================
-- Función genérica de auditoría
-- =====================================================
-- Registra INSERT / UPDATE / DELETE
-- Usa contexto de sesión seteado por backend:
--   SET LOCAL app.usuario
--   SET LOCAL app.ip
--   SET LOCAL app.user_agent
-- =====================================================
CREATE OR REPLACE FUNCTION fn_auditoria_generica()
RETURNS TRIGGER AS $$
DECLARE
    v_pk_column   TEXT;
    v_id_registro TEXT;
    v_operacion   TEXT;
    v_user_id     INT;
BEGIN
    -- ===========================
    -- OBTENER PK AUTOMÁTICAMENTE
    -- ===========================
    SELECT a.attname
    INTO v_pk_column
    FROM pg_index i
    JOIN pg_attribute a
      ON a.attrelid = i.indrelid
     AND a.attnum = ANY(i.indkey)
    WHERE i.indrelid = TG_RELID
      AND i.indisprimary
    LIMIT 1;

    IF v_pk_column IS NULL THEN
        RAISE EXCEPTION
            'No se pudo determinar la PK para la tabla %',
            TG_TABLE_NAME;
    END IF;

    -- usuario desde contexto (puede ser NULL)
    v_user_id := current_setting('app.current_user_id', true)::INT;

    -- ===========================
    -- IGNORAR UPDATE SOLO ultimo_login EN USUARIO
    -- ===========================
    IF TG_OP = 'UPDATE'
       AND to_jsonb(NEW) - ARRAY[
            'ultimo_login',
            'actualizado_en',
            'actualizado_por'
        ]
        =
        to_jsonb(OLD) - ARRAY[
            'ultimo_login',
            'actualizado_en',
            'actualizado_por'
        ]
    THEN
        RETURN NEW;
    END IF;

    -- ===========================
    -- OBTENER ID REGISTRO (PK)
    -- ===========================
    IF TG_OP = 'DELETE' THEN
        EXECUTE format(
            'SELECT ($1).%I::text',
            v_pk_column
        )
        INTO v_id_registro
        USING OLD;
    ELSE
        EXECUTE format(
            'SELECT ($1).%I::text',
            v_pk_column
        )
        INTO v_id_registro
        USING NEW;
    END IF;

    -- ===========================
    -- DETECTAR DELETE LÓGICO
    -- ===========================
    v_operacion :=
        CASE
            WHEN TG_OP = 'UPDATE'
                AND to_jsonb(OLD) ? 'borrado_en'
                AND to_jsonb(NEW) ? 'borrado_en'
                AND (to_jsonb(OLD)->>'borrado_en') IS NULL
                AND (to_jsonb(NEW)->>'borrado_en') IS NOT NULL
            THEN 'DELETE'
            ELSE TG_OP
        END;

    -- ===========================
    -- INSERT AUDITORÍA
    -- ===========================
    INSERT INTO auditoria_log (
        tabla_afectada,
        id_registro,
        operacion,
        valores_anteriores,
        valores_nuevos,
        id_usuario,
        ip_address,
        user_agent
    )
    VALUES (
        TG_TABLE_NAME,
        v_id_registro,
        v_operacion,
        CASE
            WHEN TG_OP IN ('UPDATE', 'DELETE')
            THEN to_jsonb(OLD)
            ELSE NULL
        END,
        CASE
            WHEN TG_OP IN ('INSERT', 'UPDATE')
            THEN to_jsonb(NEW)
            ELSE NULL
        END,
        v_user_id,
        current_setting('app.ip_address', true)::inet,
        current_setting('app.user_agent', true)
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


COMMIT;
