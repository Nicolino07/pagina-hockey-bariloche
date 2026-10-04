# backend/app/core/rate_limit.py
"""
IP del cliente y limitador de pedidos compartido por toda la app.

La API corre detrás de Cloudflare y dos nginx, así que `request.client.host`
es la IP del último proxy, igual para todos los visitantes. Con
`CLIENT_IP_HEADER` configurado se toma la IP de ese header.
"""
import ipaddress

from fastapi import Request
from slowapi import Limiter

from app.core.config import settings


def _ip_valida(valor: str | None) -> str | None:
    try:
        return str(ipaddress.ip_address((valor or "").strip()))
    except ValueError:
        return None


def client_ip(request: Request) -> str | None:
    """Devuelve la IP real del cliente, o None si no se puede determinar.

    Siempre devuelve una IP válida o None: refresh_token y auditoria_log la
    guardan en columnas INET y un texto arbitrario rompería la escritura.
    """
    if settings.client_ip_header:
        valor = request.headers.get(settings.client_ip_header, "")
        ip = _ip_valida(valor.split(",")[0])
        if ip:
            return ip
    return _ip_valida(request.client.host if request.client else None)


def _clave_rate_limit(request: Request) -> str:
    return client_ip(request) or "desconocida"


# Una sola instancia: main.py la registra en app.state y los routers la usan
# para decorar sus rutas.
limiter = Limiter(key_func=_clave_rate_limit)
