from sqlalchemy import Column, DateTime, String
from sqlalchemy.sql import func
from sqlalchemy.orm import declared_attr
from datetime import datetime

class AuditFieldsMixin:
    creado_en = Column(
        DateTime,
        server_default=func.now(),
        nullable=False
    )
    actualizado_en = Column(
        DateTime,
        onupdate=func.now(),
        nullable=True
    )
    creado_por = Column(String(100))
    actualizado_por = Column(String(100))

class SoftDeleteMixin:
    @declared_attr
    def borrado_en(cls):
        return Column(DateTime, nullable=True)

    def soft_delete(self, usuario: str | None = None):
        self.borrado_en = datetime.utcnow()
        if usuario:
            self.actualizado_por = usuario

    def restore(self, usuario: str | None = None):
        self.borrado_en = None
        if usuario:
            self.actualizado_por = usuario

    @property
    def is_deleted(self):
        return self.borrado_en is not None