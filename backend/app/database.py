
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session, with_loader_criteria
import os

from app.models.mixins import SoftDeleteMixin
from app.core.context import current_user_ctx

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# =====================================================
# Auditoría automática
# =====================================================
@event.listens_for(Session, "before_flush")
def apply_audit_fields(session, flush_context, instances):
    user = current_user_ctx.get()
    if not user:
        return

    for obj in session.new:
        if hasattr(obj, "creado_por") and not obj.creado_por:
            obj.creado_por = user.username

    for obj in session.dirty:
        if hasattr(obj, "actualizado_por"):
            obj.actualizado_por = user.username


# =====================================================
# Soft delete global
# =====================================================
@event.listens_for(Session, "do_orm_execute")
def _add_soft_delete_filter(execute_state):
    if (
        execute_state.is_select
        and not execute_state.execution_options.get("include_deleted", False)
    ):
        execute_state.statement = execute_state.statement.options(
            with_loader_criteria(
                SoftDeleteMixin,
                lambda cls: cls.borrado_en.is_(None),
                include_aliases=True,
            )
        )
