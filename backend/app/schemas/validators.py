"""
Validadores reutilizables para schemas Pydantic.
"""
from datetime import date
from typing import Any


def corregir_anio_fecha(v: Any) -> Any:
    """
    Corrije fechas con año de dos dígitos (ej: año 26 → 2026).
    Pydantic ya parsea el string a date antes de llegar aquí,
    por lo que controlamos el objeto date resultante.
    """
    if isinstance(v, date) and v.year < 100:
        return v.replace(year=v.year + 2000)
    return v
