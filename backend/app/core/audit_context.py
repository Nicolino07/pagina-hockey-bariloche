from sqlalchemy import text
from sqlalchemy.orm import Session


def set_audit_context(
    db: Session,
    *,
    user_id: int | None,
    username: str | None,
    ip_address: str | None,
    user_agent: str | None,
):
    """
    Establece el contexto de auditoría en la sesión PostgreSQL actual.
    Los valores quedan disponibles para fn_auditoria_generica y fn_set_actualizado_en
    durante toda la transacción (set_config con is_local=true).
    """
    # is_local=false: el valor persiste en toda la conexión (no solo en la transacción actual).
    # Es seguro porque get_db cierra la sesión al terminar el request.
    db.execute(
        text("""
            SELECT
                set_config('app.current_user_id', :user_id, false),
                set_config('app.current_username', :username, false),
                set_config('app.ip_address', :ip_address, false),
                set_config('app.user_agent', :user_agent, false)
        """),
        {
            "user_id": str(user_id) if user_id is not None else "",
            "username": username or "",
            "ip_address": ip_address or "",
            "user_agent": user_agent or "",
        }
    )
