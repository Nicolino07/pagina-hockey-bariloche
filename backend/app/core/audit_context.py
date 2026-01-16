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
    db.execute(
        text("""
            SELECT
                set_config('app.user_id', :user_id, true),
                set_config('app.username', :username, true),
                set_config('app.ip_address', :ip_address, true),
                set_config('app.user_agent', :user_agent, true)
        """),
        {
            "user_id": str(user_id) if user_id is not None else None,
            "username": username,
            "ip_address": ip_address,
            "user_agent": user_agent,
        }
    )
