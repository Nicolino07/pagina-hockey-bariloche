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
-- Función genérica de auditoría (CORREGIDA)
-- =====================================================
CREATE OR REPLACE FUNCTION fn_auditoria_generica()
RETURNS TRIGGER AS $$
DECLARE
    v_pk_column   TEXT;
    v_id_registro TEXT;
    v_operacion   TEXT;
    v_user_id     INT;
    v_ip_address  TEXT;
    v_user_agent  TEXT;
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

    -- ===========================
    -- OBTENER DATOS DE CONTEXTO (con manejo de errores)
    -- ===========================
    BEGIN
        v_user_id := current_setting('app.current_user_id', true)::INT;
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;
    END;

    BEGIN
        v_ip_address := current_setting('app.ip_address', true);
    EXCEPTION WHEN OTHERS THEN
        v_ip_address := NULL;
    END;

    BEGIN
        v_user_agent := current_setting('app.user_agent', true);
    EXCEPTION WHEN OTHERS THEN
        v_user_agent := NULL;
    END;

    -- ===========================
    -- IGNORAR UPDATE SOLO DE CAMPOS DE AUDITORÍA
    -- ===========================
    IF TG_OP = 'UPDATE' THEN
        -- Remover campos de auditoría para comparación
        IF (to_jsonb(NEW) - ARRAY[
            'ultimo_login',
            'actualizado_en',
            'actualizado_por',
            'borrado_en',
            'creado_en',
            'creado_por'
        ]) =
        (to_jsonb(OLD) - ARRAY[
            'ultimo_login',
            'actualizado_en',
            'actualizado_por',
            'borrado_en',
            'creado_en',
            'creado_por'
        ]) THEN
            RETURN NEW;
        END IF;
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
        ip_address,           -- Tipo INET
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
        v_ip_address::inet,   -- CAST explícito a INET
        v_user_agent
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIONES DE VALIDACIÓN DE ROL ÚNICO POR CLUB
-- =====================================================

-- =====================================================
-- FUNCIÓN: validar_rol_unico_por_club
-- Propósito: Valida que una persona no tenga el mismo rol en clubes diferentes
-- =====================================================
CREATE OR REPLACE FUNCTION validar_rol_unico_por_club(
    p_id_persona INT,
    p_rol tipo_rol_persona,
    p_id_club_destino INT,
    p_excluir_id_plantel_integrante INT DEFAULT NULL
)
RETURNS VARCHAR
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_club_conflicto_nombre VARCHAR(100);
    v_equipo_conflicto_nombre VARCHAR(100);
    v_categoria_conflicto tipo_categoria;
    v_fecha_alta_conflicto DATE;
    v_mensaje VARCHAR;
BEGIN
    -- Buscar si ya existe el mismo rol en otro club
    SELECT 
        c.nombre,
        eq.nombre,
        eq.categoria,
        pi.fecha_alta
    INTO 
        v_club_conflicto_nombre,
        v_equipo_conflicto_nombre,
        v_categoria_conflicto,
        v_fecha_alta_conflicto
    FROM plantel_integrante pi
    JOIN plantel pl ON pi.id_plantel = pl.id_plantel
    JOIN equipo eq ON pl.id_equipo = eq.id_equipo
    JOIN club c ON eq.id_club = c.id_club
    WHERE pi.id_persona = p_id_persona
    AND pi.rol_en_plantel = p_rol                     -- Mismo rol
    AND eq.id_club != p_id_club_destino              -- Club diferente
    AND pi.fecha_baja IS NULL                        -- Solo activos
    AND pl.activo = true                             -- Plantel activo
    AND pi.id_plantel_integrante != COALESCE(p_excluir_id_plantel_integrante, -1)  -- Excluir actualización
    LIMIT 1;

    -- Si encontramos conflicto, construir mensaje descriptivo
    IF v_club_conflicto_nombre IS NOT NULL THEN
        v_mensaje := format(
            'La persona ya tiene el rol "%s" activo en otro club. ' ||
            'Detalles del conflicto: ' ||
            'Club: %s, ' ||
            'Equipo: %s (%s), ' ||
            'Fecha de alta: %s. ' ||
            'Regla: No se puede tener el mismo rol en clubes diferentes.',
            p_rol,
            v_club_conflicto_nombre,
            v_equipo_conflicto_nombre,
            v_categoria_conflicto,
            v_fecha_alta_conflicto
        );
        RETURN v_mensaje;
    END IF;

    -- No hay conflicto
    RETURN NULL;
END;
$$;

-- =====================================================
-- FUNCIÓN: obtener_club_desde_plantel
-- Propósito: Helper para obtener el club desde un ID de plantel
-- =====================================================
CREATE OR REPLACE FUNCTION obtener_club_desde_plantel(p_id_plantel INT)
RETURNS INT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_id_club INT;
BEGIN
    SELECT e.id_club INTO v_id_club
    FROM plantel p
    JOIN equipo e ON p.id_equipo = e.id_equipo
    WHERE p.id_plantel = p_id_plantel;
    
    RETURN v_id_club;
END;
$$;

-- =====================================================
-- FUNCIÓN: obtener_persona_roles_activos
-- Propósito: Obtener todos los roles activos de una persona por club
-- =====================================================
CREATE OR REPLACE FUNCTION obtener_persona_roles_activos(p_id_persona INT)
RETURNS TABLE (
    club_id INT,
    club_nombre VARCHAR(100),
    rol tipo_rol_persona,
    equipo_nombre VARCHAR(100),
    categoria tipo_categoria,
    plantel_activo BOOLEAN,
    fecha_alta DATE,
    fecha_baja DATE
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id_club as club_id,
        c.nombre as club_nombre,
        pi.rol_en_plantel as rol,
        e.nombre as equipo_nombre,
        e.categoria as categoria,
        pl.activo as plantel_activo,
        pi.fecha_alta,
        pi.fecha_baja
    FROM plantel_integrante pi
    JOIN plantel pl ON pi.id_plantel = pl.id_plantel
    JOIN equipo e ON pl.id_equipo = e.id_equipo
    JOIN club c ON e.id_club = c.id_club
    WHERE pi.id_persona = p_id_persona
    AND pi.fecha_baja IS NULL  -- Solo activos
    ORDER BY c.nombre, pi.rol_en_plantel, e.categoria;
END;
$$;

-- =====================================================
-- FUNCIÓN: puede_agregar_rol_plantel
-- Propósito: Verificar si se puede agregar un rol a una persona en un plantel
-- =====================================================
CREATE OR REPLACE FUNCTION puede_agregar_rol_plantel(
    p_id_persona INT,
    p_rol tipo_rol_persona,
    p_id_plantel INT
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_id_club_destino INT;
    v_mensaje_validacion VARCHAR;
    v_roles_actuales JSONB;
BEGIN
    -- Obtener el club destino
    v_id_club_destino := obtener_club_desde_plantel(p_id_plantel);
    
    -- Validar regla de rol único por club
    v_mensaje_validacion := validar_rol_unico_por_club(
        p_id_persona,
        p_rol,
        v_id_club_destino
    );
    
    -- Obtener roles actuales para información
    SELECT JSONB_AGG(
        JSONB_BUILD_OBJECT(
            'club', c.nombre,
            'rol', pi.rol_en_plantel,
            'equipo', e.nombre,
            'categoria', e.categoria,
            'activo', pl.activo
        )
    ) INTO v_roles_actuales
    FROM plantel_integrante pi
    JOIN plantel pl ON pi.id_plantel = pl.id_plantel
    JOIN equipo e ON pl.id_equipo = e.id_equipo
    JOIN club c ON e.id_club = c.id_club
    WHERE pi.id_persona = p_id_persona
    AND pi.fecha_baja IS NULL;
    
    -- Si no hay roles actuales, inicializar array vacío
    IF v_roles_actuales IS NULL THEN
        v_roles_actuales := '[]'::JSONB;
    END IF;
    
    -- Retornar resultado completo
    RETURN JSONB_BUILD_OBJECT(
        'valido', v_mensaje_validacion IS NULL,
        'mensaje', COALESCE(v_mensaje_validacion, 'Puede agregar el rol.'),
        'conflicto', v_mensaje_validacion IS NOT NULL,
        'id_club_destino', v_id_club_destino,
        'roles_actuales', v_roles_actuales
    );
END;
$$;

-- =====================================================
-- FUNCIÓN: fn_plantel_integrante_validar_rol_unico
-- Propósito: Función combinada para validar rol en plantel y rol único por club
-- =====================================================
CREATE OR REPLACE FUNCTION fn_plantel_integrante_validar_rol_unico()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_id_club_destino INT;
    v_mensaje_error VARCHAR;
BEGIN
    -- 1. Validar que el rol existe en persona_rol (validación original)
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

    -- 2. Validar regla de rol único por club (nueva validación)
    SELECT e.id_club INTO v_id_club_destino
    FROM plantel p
    JOIN equipo e ON p.id_equipo = e.id_equipo
    WHERE p.id_plantel = NEW.id_plantel;
    
    v_mensaje_error := validar_rol_unico_por_club(
        NEW.id_persona,
        NEW.rol_en_plantel,
        v_id_club_destino,
        CASE 
            WHEN TG_OP = 'UPDATE' THEN OLD.id_plantel_integrante 
            ELSE NULL 
        END
    );
    
    IF v_mensaje_error IS NOT NULL THEN
        RAISE EXCEPTION '%', v_mensaje_error
        USING HINT = 'Para tener este rol en este club, primero debe dar de baja el mismo rol en otro club.';
    END IF;
    
    RETURN NEW;
END;
$$;

-- =====================================================
-- FUNCIÓN: fn_recalcular_posiciones_por_gol
-- =====================================================
CREATE OR REPLACE FUNCTION fn_recalcular_posiciones_por_gol()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_id_torneo INT;
BEGIN
    SELECT p.id_torneo
    INTO v_id_torneo
    FROM partido p
    WHERE p.id_partido = COALESCE(NEW.id_partido, OLD.id_partido)
      AND p.estado_partido = 'TERMINADO';

    IF v_id_torneo IS NOT NULL THEN
        PERFORM recalcular_tabla_posiciones(v_id_torneo);
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;

-- =====================================================
-- FUNCIÓN: fn_recalcular_posiciones
-- =====================================================
CREATE OR REPLACE FUNCTION fn_recalcular_posiciones()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'UPDATE'
       AND OLD.estado_partido IS DISTINCT FROM 'TERMINADO'
       AND NEW.estado_partido = 'TERMINADO' THEN

        PERFORM recalcular_tabla_posiciones(NEW.id_torneo);

    END IF;

    RETURN NEW;
END;
$$;



-- =====================================================
-- FUNCIONES ADICIONALES PARA NUEVAS TABLAS
-- =====================================================

-- Función para validar refresh_token (añadir al final del archivo 004_functions.sql)
CREATE OR REPLACE FUNCTION fn_validar_refresh_token()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.expires_at < CURRENT_TIMESTAMP THEN
        RAISE EXCEPTION 'Refresh token expirado';
    END IF;
    
    IF NEW.revoked = TRUE THEN
        RAISE EXCEPTION 'Refresh token revocado';
    END IF;
    
    RETURN NEW;
END;
$$;

-- Función para validar fixture_partido (añadir al final del archivo 004_functions.sql)
CREATE OR REPLACE FUNCTION fn_validar_fixture_partido()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_mismo_club BOOLEAN;
BEGIN
    -- Verificar si ambos equipos son del mismo club
    SELECT (e1.id_club = e2.id_club)
    INTO v_mismo_club
    FROM equipo e1
    JOIN equipo e2 ON e2.id_equipo = NEW.id_equipo_visitante
    WHERE e1.id_equipo = NEW.id_equipo_local;
    
    -- Opcional: Permitir o no partidos entre equipos del mismo club
    -- IF v_mismo_club THEN
    --     RAISE EXCEPTION 'No se pueden programar partidos entre equipos del mismo club en el fixture';
    -- END IF;
    
    RETURN NEW;
END;
$$;

COMMIT;