import uuid
from datetime import datetime
from staffweb.firebase import db

def registrar_auditoria_manual(request, accion, resultado, descripcion=""):
    usuario_id = request.session.get("usuario_id", "anonimo")
    ip_origen = request.META.get("REMOTE_ADDR", "")
    navegador = request.META.get("HTTP_USER_AGENT", "")
    ahora = datetime.now().isoformat()
    
    log_data = {
        "id_auditoria": str(uuid.uuid4()),
        "id_rut": usuario_id,
        "accion": accion,
        "descripcion": descripcion,
        "fecha_hora": ahora,
        "ip_origen": ip_origen,
        "navegador": navegador,
        "resultado": resultado
    }

    try:
        ref = db.reference("Auditoria")
        ref.push(log_data)
    except Exception as e:
        print("Error registrando log manual:", e)

def registrar_auditoria_movil(request, accion, resultado, descripcion=""):
    usuario_id = request.rut_usuario_actual
    ip_origen = request.META.get("REMOTE_ADDR", "")
    navegador = request.META.get("HTTP_USER_AGENT", "")
    ahora = datetime.now().isoformat()
    
    log_data = {
        "id_auditoria": str(uuid.uuid4()),
        "id_rut": usuario_id,
        "accion": accion,
        "descripcion": descripcion,
        "fecha_hora": ahora,
        "ip_origen": ip_origen,
        "navegador": navegador,
        "resultado": resultado
    }

    try:
        ref = db.reference("Auditoria")
        ref.push(log_data)
    except Exception as e:
        print("Error registrando log manual movil:", e)