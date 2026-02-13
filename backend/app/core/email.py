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