import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException
import os

# Configurar clave API
configuration = sib_api_v3_sdk.Configuration()
configuration.api_key['api-key'] = os.environ.get("BREVO_API_KEY")

# Función para enviar correos
def enviar_correo(destinatario, asunto, texto, html):
    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))

    send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
        to=[{"email": destinatario}],
        sender={"name": "ManaStaff", "email": "manastaffnoreply@gmail.com"},
        subject=asunto,
        html_content=html,
        text_content=texto
    )

    try:
        api_instance.send_transac_email(send_smtp_email)
        print(f"Correo enviado a {destinatario}")
        return True
    except ApiException as e:
        print(f"❌ Error al enviar correo: {e}")
        return False
