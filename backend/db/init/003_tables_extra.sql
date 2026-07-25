-- =====================================================
-- 003_tables_extra.sql
-- Tablas de seguridad, auditoría y fixture (CORREGIDA)
-- =====================================================

BEGIN;


-- ================================================
-- USUARIO
-- ================================================

CREATE TABLE IF NOT EXISTS usuario (
    id_usuario        INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username          VARCHAR(50) NOT NULL UNIQUE CHECK (username <> ''),
    email             VARCHAR(100) NOT NULL UNIQUE 
        CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
    password_hash     TEXT NOT NULL CHECK (password_hash <> ''),
    tipo               tipo_usuario NOT NULL DEFAULT 'LECTOR',
    activo            BOOLEAN NOT NULL DEFAULT TRUE,

    intentos_fallidos INT NOT NULL DEFAULT 0 CHECK (intentos_fallidos >= 0),
    bloqueado_hasta   TIMESTAMP,
    ultimo_login      TIMESTAMP,

    creado_en         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en    TIMESTAMP DEFAULT NULL,
    borrado_en        TIMESTAMP DEFAULT NULL,
    creado_por        VARCHAR(100),
    actualizado_por   VARCHAR(100),

    CONSTRAINT chk_usuario_bloqueo CHECK (
        bloqueado_hasta IS NULL OR bloqueado_hasta > creado_en
    )
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
    revoked_at       TIMESTAMP,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Login original: se arrastra en cada rotación para medir el tope
    -- absoluto de sesión (ver session_max_hours) desde el login real.
    session_started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
    rueda            VARCHAR(10) NOT NULL DEFAULT 'ida' CHECK (rueda IN ('ida', 'vuelta')),
    fecha_programada DATE,

    id_equipo_descansa INT REFERENCES equipo(id_equipo) ON DELETE SET NULL,

    creado_en        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por       VARCHAR(100),
    actualizado_en   TIMESTAMP DEFAULT NULL,
    actualizado_por  VARCHAR(100),

    CONSTRAINT unq_fixture_fecha UNIQUE (id_torneo, rueda, numero_fecha)
);


-- ================================================
-- FIXTURE_PLAYOFF_RONDA
-- Copas o formato eliminicion
-- ================================================

CREATE TABLE IF NOT EXISTS fixture_playoff_ronda (
    id_fixture_playoff_ronda INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_torneo                INT NOT NULL REFERENCES torneo(id_torneo) ON DELETE CASCADE,
    nombre                   VARCHAR(100) NOT NULL,
    orden                    INT NOT NULL,
    ida_y_vuelta             BOOLEAN NOT NULL DEFAULT FALSE,
    es_tercer_puesto         BOOLEAN NOT NULL DEFAULT FALSE,

    creado_en                TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por               VARCHAR(100),

    CONSTRAINT unq_playoff_ronda UNIQUE (id_torneo, orden)
);

-- ================================================
-- FIXTURE (agrupación del calendario)
-- El "partido programado" es un `partido` (tabla única); acá quedan solo las
-- estructuras de agrupación (fixture_fecha, fixture_playoff_ronda).
-- ================================================

-- Unificación partido/fixture: FK de agrupación en partido hacia el calendario.
-- Se agregan acá porque fixture_fecha / fixture_playoff_ronda se crean en este archivo.
ALTER TABLE partido
    ADD CONSTRAINT fk_partido_fixture_fecha
        FOREIGN KEY (id_fixture_fecha)
        REFERENCES fixture_fecha(id_fixture_fecha) ON DELETE SET NULL,
    ADD CONSTRAINT fk_partido_fixture_playoff_ronda
        FOREIGN KEY (id_fixture_playoff_ronda)
        REFERENCES fixture_playoff_ronda(id_fixture_playoff_ronda) ON DELETE SET NULL;


CREATE TABLE noticias (
    id_noticia      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    titulo          VARCHAR(255) NOT NULL,
    imagen_url      TEXT,
    epigrafe        VARCHAR(255),
    texto           TEXT NOT NULL,
    url_externa     TEXT,

    -- Auditoría y Soft Delete
    creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en  TIMESTAMP DEFAULT NULL,
    borrado_en      TIMESTAMP DEFAULT NULL,
    creado_por      VARCHAR(100),
    actualizado_por VARCHAR(100)
);

COMMIT;