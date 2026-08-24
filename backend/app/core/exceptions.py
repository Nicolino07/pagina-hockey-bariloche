
class AppError(Exception):
    """
    Error base de la aplicación (dominio).
    """
    status_code: int = 400
    code: str = "APP_ERROR"
    message: str = "Error de aplicación"

    def __init__(self, message: str | None = None):
        if message:
            self.message = message
        super().__init__(self.message)


# =========================
# Auth / Seguridad
# =========================

class AuthenticationError(AppError):
    status_code = 401
    code = "AUTHENTICATION_ERROR"
    message = "Credenciales inválidas"


class AuthorizationError(AppError):
    status_code = 403
    code = "AUTHORIZATION_ERROR"
    message = "Permisos insuficientes"


# =========================
# Dominio / Negocio
# =========================

class NotFoundError(AppError):
    status_code = 404
    code = "NOT_FOUND"
    message = "Recurso no encontrado"


class ValidationError(AppError):
    status_code = 422
    code = "VALIDATION_ERROR"
    message = "Datos inválidos"


class ConflictError(AppError):
    status_code = 409
    code = "CONFLICT"
    message = "Conflicto de datos"


class BusinessRuleError(AppError):
    status_code = 422
    code = "BUSINESS_RULE"
    message = "Violación de regla de negocio"


class ConfirmacionRequeridaError(AppError):
    """
    La operación viola una regla que es de advertencia, no de bloqueo.

    El cliente puede reintentar el mismo request con `forzar=True` para
    confirmarla. Se distingue de BusinessRuleError por el `code`, para que el
    frontend sepa que debe ofrecer la confirmación sin tener que adivinarlo
    a partir del texto del mensaje.
    """
    status_code = 409
    code = "CONFIRMACION_REQUERIDA"
    message = "La operación requiere confirmación explícita"
