"""Fix funciones de auditoría: actualizado_por y contexto de usuario

Problemas corregidos:
1. fn_set_actualizado_en: ahora también escribe actualizado_por desde app.current_user_id
2. fn_auditoria_generica: usaba app.current_user_id correctamente pero
   audit_context.py seteaba app.user_id — se unifica a app.current_user_id

Revision ID: 0012
Revises: 0011
Create Date: 2026-04-14
"""
from typing import Sequence, Union
from alembic import op

revision: str = "0012"
down_revision: Union[str, None] = "0011"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


FN_SET_ACTUALIZADO_EN_NEW = """
CREATE OR REPLACE FUNCTION fn_set_actualizado_en()
RETURNS TRIGGER AS $$
DECLARE
    v_username TEXT;
BEGIN
    NEW.actualizado_en := CURRENT_TIMESTAMP;

    BEGIN
        v_username := current_setting('app.current_username', true);
    EXCEPTION WHEN OTHERS THEN
        v_username := NULL;
    END;

    IF v_username IS NOT NULL AND v_username <> '' THEN
        NEW.actualizado_por := v_username;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
"""

FN_SET_ACTUALIZADO_EN_OLD = """
CREATE OR REPLACE FUNCTION fn_set_actualizado_en()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
"""

FN_AUDITORIA_GENERICA_NEW = """
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
        RAISE EXCEPTION 'No se pudo determinar la PK para la tabla %', TG_TABLE_NAME;
    END IF;

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

    IF TG_OP = 'UPDATE' THEN
        IF (to_jsonb(NEW) - ARRAY[
            'ultimo_login', 'actualizado_en', 'actualizado_por',
            'borrado_en', 'creado_en', 'creado_por'
        ]) =
        (to_jsonb(OLD) - ARRAY[
            'ultimo_login', 'actualizado_en', 'actualizado_por',
            'borrado_en', 'creado_en', 'creado_por'
        ]) THEN
            RETURN NEW;
        END IF;
    END IF;

    IF TG_OP = 'DELETE' THEN
        EXECUTE format('SELECT ($1).%I::text', v_pk_column)
        INTO v_id_registro USING OLD;
    ELSE
        EXECUTE format('SELECT ($1).%I::text', v_pk_column)
        INTO v_id_registro USING NEW;
    END IF;

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

    INSERT INTO auditoria_log (
        tabla_afectada, id_registro, operacion,
        valores_anteriores, valores_nuevos,
        id_usuario, ip_address, user_agent
    ) VALUES (
        TG_TABLE_NAME,
        v_id_registro,
        v_operacion,
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
        v_user_id,
        CASE WHEN v_ip_address IS NOT NULL AND v_ip_address <> '' THEN v_ip_address::inet ELSE NULL END,
        v_user_agent
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
"""


def upgrade() -> None:
    op.execute(FN_SET_ACTUALIZADO_EN_NEW)
    op.execute(FN_AUDITORIA_GENERICA_NEW)


def downgrade() -> None:
    op.execute(FN_SET_ACTUALIZADO_EN_OLD)
    # Restaurar fn_auditoria_generica con app.user_id (comportamiento anterior)
    op.execute(FN_AUDITORIA_GENERICA_NEW.replace(
        "app.current_user_id", "app.user_id"
    ))
