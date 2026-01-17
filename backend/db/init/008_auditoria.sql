BEGIN;

-- ================================================
-- AUDITORÍA GENERAL
-- ================================================

CREATE TABLE IF NOT EXISTS auditoria_log (
    id_log             INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tabla_afectada     VARCHAR(100) NOT NULL CHECK (tabla_afectada <> ''),
    id_registro        TEXT,
    operacion          VARCHAR(20) NOT NULL
        CHECK (operacion IN ('INSERT', 'UPDATE', 'DELETE')),
    valores_anteriores JSONB,
    valores_nuevos     JSONB,
    id_usuario         INT REFERENCES usuario(id_usuario),
    fecha_hora         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address         INET,
    user_agent         TEXT
);
 


-- =====================================================
-- Vista: Auditoría legible para backoffice
-- esta vista esta aqui para evitar error ""auditoria_log does not exist"
-- =====================================================

CREATE OR REPLACE VIEW vw_auditoria AS
SELECT
    a.id_log,
    a.fecha_hora,
    a.tabla_afectada,
    a.operacion,
    a.id_registro,

    -- Usuario (si existe)
    a.id_usuario,
    u.username AS usuario,

    -- Contexto técnico
    a.ip_address,
    a.user_agent,

    -- Datos crudos
    a.valores_anteriores,
    a.valores_nuevos

FROM auditoria_log a
LEFT JOIN usuario u
       ON u.id_usuario = a.id_usuario;

COMMIT;