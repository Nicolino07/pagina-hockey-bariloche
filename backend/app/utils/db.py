from sqlalchemy.orm import Session
from fastapi import Request
from app.models import Usuario

def set_audit_context(
    db: Session,
    request: Request,
    user: Usuario | None
):
    username = user.username if user else "anonymous"
    user_agent = request.headers.get("user-agent", "unknown")

    db.execute("SET app.current_user = :u", {"u": username})
    db.execute("SET app.user_agent = :ua", {"ua": user_agent})

def only_active(query, model):
    if hasattr(model, "activo"):
        return query.filter(model.activo.is_(True))
    return query
