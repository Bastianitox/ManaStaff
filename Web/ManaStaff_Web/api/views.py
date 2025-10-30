from django.http import JsonResponse
from staffweb.firebase import auth, db, storage
from django.views.decorators.http import require_POST,require_GET
from django.views.decorators.csrf import csrf_exempt
from urllib.parse import unquote_plus
from staffweb.utils.auditoria import registrar_auditoria_manual
from staffweb.utils.decorators import firebase_auth_required

#----------------------------------- SESIÓN -----------------------------------




#----------------------------------- SOLICITUDES -----------------------------------
@csrf_exempt
@require_GET
@firebase_auth_required
def obtener_solicitudes(request):
    
    rut_usuario_actual = request.rut_usuario_actual

    ref = db.reference("Solicitudes").order_by_child("id_rut").equal_to(rut_usuario_actual).get() or {}

    # 🔄 Convertir a lista
    tipo_solicitud = db.reference("TiposSolicitud").get() or {}
    solicitudes_list = []
    for key, value in ref.items():

        tipo_nombre = "Sin tipo"
        for key_tipo, value_tipo in tipo_solicitud.items():
            if key_tipo == value.get("tipo_solicitud"):
                tipo_nombre = value_tipo.get("nombre")
                break

        solicitudes_list.append({
            "id": key,
            "asunto": value.get("Asunto"),
            "descripcion": value.get("Descripcion"),
            "estado": value.get("Estado"),
            "fecha_solicitud": value.get("Fecha_solicitud"),
            "fecha_inicio": value.get("Fecha_inicio"),
            "fecha_fin": value.get("Fecha_fin"),
            "tipo_solicitud_nombre": tipo_nombre
        })

    return JsonResponse({"solicitudes": solicitudes_list})

@csrf_exempt
@require_POST
@firebase_auth_required
def cancelar_solicitud(request, id_solicitud):
    
    rut_usuario_actual = request.rut_usuario_actual
    
    #OBTENEMOS LA SOLICITUD A ELIMINAR
    solicitud_a_cancelar = db.reference("Solicitudes").child(id_solicitud).get() or {}

    #VALIDAMOS QUE LA SOLICITUD EXISTA
    if solicitud_a_cancelar == {}:
        return JsonResponse({"status": "false", "message": "No se pudo encontrar la solicitud."})

    #VALIDAMOS QUE LA SOLICITUD PERTENEZCA AL USUARIO
    rut_usuario_solicitud = solicitud_a_cancelar.get("id_rut")

    if rut_usuario_actual != rut_usuario_solicitud:
        registrar_auditoria_manual(request, "Cuatro", "false", f"El usuario {rut_usuario_actual} intento eliminar una solicitud que no le pertenece {rut_usuario_solicitud}.")
        return JsonResponse({"status": "false", "message": "Esa no es su solicitud."})
    
    if solicitud_a_cancelar.get("Estado") != "pendiente":
        registrar_auditoria_manual(request, "Cuatro", "false", f"El usuario {rut_usuario_actual} intento eliminar una solicitud que no esta en estado pendiente.")
        return JsonResponse({"status": "false", "message": "Esa solicitud ya fue resuelta."})

    #VALIDAMOS QUE EXISTA UN ARCHIVO EN LA SOLICITUD (PARA ELIMINARLO DE STORAGE) 
    archivo_solicitud_a_cancelar = solicitud_a_cancelar.get("archivo")
    
    if archivo_solicitud_a_cancelar:
        try:
            #SI EXISTE LO ELIMINAMOS
            bucket = storage.bucket()

            #OBTENEMOS EL NOMBREL DEL ARCHIVO A ELIMINAR
            nombre_archivo = archivo_solicitud_a_cancelar.split("/")[-1]
            nombre_archivo = str(nombre_archivo.split("?")[0])
            nombre_archivo = unquote_plus(nombre_archivo)
            blob = bucket.blob(f"{rut_usuario_actual}/Solicitudes/{id_solicitud}/{nombre_archivo}")

            blob.delete()
        except Exception as e:
            return JsonResponse({"status": "false", "message": f"Error al eliminar el archivo: {e}"})

    #AHORA SE ELIMINA DE FIREBASE
    db.reference('/Solicitudes/'+id_solicitud).delete()
    registrar_auditoria_manual(request, "Cuatro", "éxito", f"El usuario {rut_usuario_actual} ha eliminado su solicitud {solicitud_a_cancelar.get("Asunto")} con éxito.")
    return JsonResponse({"status": "success", "message": "Solicitud cancelada (eliminada)."})

@csrf_exempt
@require_GET
@firebase_auth_required
def detalle_solicitud(request, id_solicitud):
    rut_usuario_actual = request.rut_usuario_actual
    
    #OBTENEMOS LA SOLICITUD A ELIMINAR
    solicitud_a_ver = db.reference("Solicitudes").child(id_solicitud).get() or {}

    #VALIDAMOS QUE LA SOLICITUD EXISTA
    if not solicitud_a_ver:
        return JsonResponse({"error": "No se pudo encontrar la solicitud."}, status=404)

    #VALIDAMOS QUE LA SOLICITUD PERTENEZCA AL USUARIO
    rut_usuario_solicitud = solicitud_a_ver.get("id_rut")

    if rut_usuario_actual != rut_usuario_solicitud:
        registrar_auditoria_manual(request, "Cuatro", "false", f"El usuario {rut_usuario_actual} intento ver el detalle de una solicitud que no le pertenece {rut_usuario_solicitud}.")
        return JsonResponse({"error": "Esa no es su solicitud."}, status=403)
    
    #OBTENER LOS DETALLES DE LA SOLICITUD Y DEVOLVERLOS
    return JsonResponse({"status": "success", "message": "Solicitud obtenida", "solicitud": solicitud_a_ver}, status=200)


#----------------------------------- ANUNCIOS -----------------------------------



#----------------------------------- USUARIOS / PERFIL -----------------------------------




#----------------------------------- DOCUMENTOS -----------------------------------







@csrf_exempt
def test_token(request):
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return JsonResponse({"error": "Token faltante"}, status=401)

    token = auth_header.split("Bearer ")[1] if auth_header.startswith("Bearer ") else auth_header
    try:
        decoded = auth.verify_id_token(token)
        return JsonResponse({"uid": decoded["uid"], "email": decoded.get("email")})
    except Exception as e:
        return JsonResponse({"error": f"Token inválido: {str(e)}"}, status=401)
