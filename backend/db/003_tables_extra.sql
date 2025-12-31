-- =====================================================
-- 003_tables_extra.sql
-- Tablas de seguridad, auditoría y fixture (CORREGIDA)
-- =====================================================

BEGIN;

-- ================================================
-- AUDITORÍA GENERAL
-- ================================================

CREATE TABLE IF NOT EXISTS auditoria_log (
    id_log             INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tabla_afectada     VARCHAR(100) NOT NULL CHECK (tabla_afectada <> ''),
    id_registro        INT,
    operacion          VARCHAR(20) NOT NULL
        CHECK (operacion IN ('INSERT', 'UPDATE', 'DELETE')),
    valores_anteriores JSONB,
    valores_nuevos     JSONB,
    usuario            VARCHAR(100),
    fecha_hora         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address         INET,
    user_agent         TEXT
);

-- ================================================
-- USUARIO
-- ================================================

CREATE TABLE IF NOT EXISTS usuario (
    id_usuario        INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username          VARCHAR(50) NOT NULL UNIQUE CHECK (username <> ''),
    email             VARCHAR(100) NOT NULL UNIQUE 
        CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
    password_hash     TEXT NOT NULL CHECK (password_hash <> ''),
    rol               usuario_tipo NOT NULL DEFAULT 'lector',
    activo            BOOLEAN NOT NULL DEFAULT TRUE,

    intentos_fallidos INT NOT NULL DEFAULT 0 CHECK (intentos_fallidos >= 0),
    bloqueado_hasta   TIMESTAMP,
    ultimo_login      TIMESTAMP,

    id_persona        INT REFERENCES persona(id_persona),

    creado_en         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por        VARCHAR(100),
    actualizado_por   VARCHAR(100),

    CONSTRAINT chk_usuario_bloqueo CHECK (
        bloqueado_hasta IS NULL OR bloqueado_hasta > creado_en
    )
);

-- ================================================
-- PERMISOS POR ROL / TABLA
-- ================================================

CREATE TABLE IF NOT EXISTS permiso_user_tabla (
    id_permiso    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    rol_usuario   usuario_tipo NOT NULL,
    tabla         VARCHAR(30) NOT NULL CHECK (tabla <> ''),
    operacion     operacion_permiso_tipo NOT NULL,
    permitido     BOOLEAN NOT NULL DEFAULT FALSE,

    creado_en     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por    VARCHAR(100) CHECK (creado_por <> ''),

    CONSTRAINT unq_permiso_rol_tabla UNIQUE (rol_usuario, tabla, operacion)
);

-- ================================================
-- REFRESH TOKEN
-- ================================================

CREATE TABLE IF NOT EXISTS refresh_token (
    id_refresh_token INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_usuario       INT NOT NULL
        REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    token_hash       TEXT NOT NULL CHECK (token_hash <> ''),
    expires_at       TIMESTAMP NOT NULL,
    revoked          BOOLEAN NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by_ip    INET,
    user_agent       TEXT,

    CONSTRAINT chk_expires_future CHECK (expires_at > created_at)
);

-- ================================================
-- FIXTURE_FECHA
-- ================================================

CREATE TABLE IF NOT EXISTS fixture_fecha (
    id_fixture_fecha INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_torneo        INT NOT NULL
        REFERENCES torneo(id_torneo) ON DELETE CASCADE,
    numero_fecha     INT NOT NULL CHECK (numero_fecha > 0),
    rueda            INT NOT NULL DEFAULT 1 CHECK (rueda IN (1, 2)),
    fecha_programada DATE,

    creado_en        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por       VARCHAR(100),

    CONSTRAINT unq_fixture_fecha UNIQUE (id_torneo, numero_fecha)
);

-- ================================================
-- FIXTURE_PARTIDO
-- ================================================

CREATE TABLE IF NOT EXISTS fixture_partido (
    id_fixture_partido  INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_fixture_fecha    INT NOT NULL
        REFERENCES fixture_fecha(id_fixture_fecha) ON DELETE CASCADE,
    id_equipo_local     INT NOT NULL REFERENCES equipo(id_equipo),
    id_equipo_visitante INT NOT NULL REFERENCES equipo(id_equipo),

    jugado              BOOLEAN NOT NULL DEFAULT FALSE,
    id_partido_real     INT REFERENCES partido(id_partido),

    creado_en           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por          VARCHAR(100),

    CONSTRAINT chk_fixture_equipos_distintos
        CHECK (id_equipo_local <> id_equipo_visitante),

    CONSTRAINT unq_fixture_partido
        UNIQUE (id_fixture_fecha, id_equipo_local, id_equipo_visitante)
);

COMMIT;