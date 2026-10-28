-- =====================================================
-- 008_auditoria.sql
-- Tablas, vistas y utilidades de auditoría
-- =====================================================

BEGIN;

-- ================================================
-- AUDITORÍA GENERAL
-- ================================================

CREATE TABLE IF NOT EXISTS auditoria_log (
    id_auditoria SERIAL PRIMARY KEY,
    tabla_afectada VARCHAR(100) NOT NULL CHECK (tabla_afectada <> ''),
    id_registro TEXT,
    operacion VARCHAR(20) NOT NULL
        CHECK (operacion IN ('INSERT', 'UPDATE', 'DELETE')),
    valores_anteriores JSONB,
    valores_nuevos JSONB,
    id_usuario INT REFERENCES usuario(id_usuario),
    fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT
);

-- =====================================================
-- Vista: Auditoría legible para backoffice
-- =====================================================

CREATE OR REPLACE VIEW vw_auditoria AS
SELECT
    a.id_auditoria AS id_log,
    a.fecha_cambio AS fecha_hora,
    a.tabla_afectada,
    a.operacion,
    a.id_registro,
    a.id_usuario,
    u.username AS usuario,
    a.ip_address,
    a.user_agent,
    a.valores_anteriores,
    a.valores_nuevos
FROM auditoria_log a
LEFT JOIN usuario u ON u.id_usuario = a.id_usuario;


COMMIT;