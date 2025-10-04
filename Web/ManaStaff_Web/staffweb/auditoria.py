import uuid
from datetime import datetime
from staffweb.firebase import database

def registrar_auditoria_manual(request, accion, descripcion=""):
    usuario_rut = request.session.get("usuario_rut", "anonimo")
    ip_origen = request.META.get("REMOTE_ADDR", "")
    navegador = request.META.get("HTTP_USER_AGENT", "")
    ahora = datetime.now().isoformat()
    
    log_data = {
        "id_auditoria": str(uuid.uuid4()),
        "usuario_rut": usuario_rut,
        "accion": accion,
        "descripcion": descripcion,
        "fecha_hora": ahora,
        "ip_origen": ip_origen,
        "navegador": navegador,
        "resultado": "exito"
    }

    try:
        database.child("Auditoria").push(log_data)
    except Exception as e:
        print("Error registrando log manual:", e)