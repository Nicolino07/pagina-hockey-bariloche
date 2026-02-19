import resend
from app.core.config import settings

# Configuramos la API Key
resend.api_key = settings.resend_api_key

def send_invite_email(email_to: str, token: str):
    link = f"{settings.frontend_url}/completar-registro?token={token}"
    
    params = {
        "from": "Hockey Bariloche <onboarding@resend.dev>",
        "to": [email_to],
        "subject": "Invitación a la Plataforma",
        "html": f"""
            <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
                <h2>¡Hola!</h2>
                <p>Has sido invitado a gestionar el sistema de <strong>Hockey Bariloche</strong>.</p>
                <p>Para configurar tu usuario y contraseña, haz clic en el botón:</p>
                <a href="{link}" style="background-color: #000; color: #fff; padding: 12px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Completar Registro
                </a>
                <p style="margin-top: 20px; font-size: 0.8em; color: #666;">
                    Este enlace expirará en 24 horas.
                </p>
            </div>
        """,
    }

    try:
        resend.Emails.send(params)
        print(f"Invitación enviada vía Resend a {email_to}")
    except Exception as e:
        print(f"Error con Resend: {e}")
        raise e
    
def send_reset_password_email(email_to: str, token: str):
    # Usamos la ruta que definimos en App.tsx
    link = f"{settings.frontend_url}/reset-password?token={token}"
    
    params = {
        "from": "Hockey Bariloche <onboarding@resend.dev>",
        "to": [email_to],
        "subject": "Restablecer tu contraseña",
        "html": f"""
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #333;">Restablecer Contraseña</h2>
                <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>Hockey Bariloche</strong>.</p>
                <p>Haz clic en el botón de abajo para elegir una nueva contraseña:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{link}" style="background-color: #2563eb; color: #fff; padding: 14px 25px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                        Restablecer Contraseña
                    </a>
                </div>
                <p style="font-size: 0.8em; color: #666;">
                    Este enlace es válido por <strong>15 minutos</strong>. Si no solicitaste este cambio, puedes ignorar este correo de forma segura.
                </p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 0.7em; color: #999; text-align: center;">Hockey Bariloche - Sistema de Gestión</p>
            </div>
        """,
    }

    try:
        resend.Emails.send(params)
        print(f"Email de recuperación enviado vía Resend a {email_to}")
    except Exception as e:
        print(f"Error con Resend al recuperar: {e}")
        # Aquí no hacemos raise para que el background task no rompa el flujo principal