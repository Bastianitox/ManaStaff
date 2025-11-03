from django.http import JsonResponse
from staffweb.firebase import auth, db, storage
from django.views.decorators.http import require_POST,require_GET, require_http_methods
from django.views.decorators.csrf import csrf_exempt
from urllib.parse import unquote_plus
from staffweb.utils.auditoria import registrar_auditoria_manual
from staffweb.utils.decorators import firebase_auth_required
from datetime import datetime, timedelta

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
        id_tipo = "Sin id tipo"
        for key_tipo, value_tipo in tipo_solicitud.items():
            if key_tipo == value.get("tipo_solicitud"):
                tipo_nombre = value_tipo.get("nombre")
                id_tipo = key_tipo
                break

        solicitudes_list.append({
            "id": key,
            "asunto": value.get("Asunto"),
            "descripcion": value.get("Descripcion"),
            "estado": value.get("Estado"),
            "fecha_solicitud": value.get("Fecha_solicitud"),
            "fecha_inicio": value.get("Fecha_inicio"),
            "fecha_fin": value.get("Fecha_fin"),
            "tipo_solicitud_nombre": tipo_nombre,
            "tipo_solicitud_id": id_tipo
        })

    return JsonResponse({"status":"success", "solicitudes": solicitudes_list}, status = 200)

@csrf_exempt
@require_http_methods(["DELETE"])
@firebase_auth_required
def cancelar_solicitud(request, id_solicitud):
    
    rut_usuario_actual = request.rut_usuario_actual
    
    #OBTENEMOS LA SOLICITUD A ELIMINAR
    solicitud_a_cancelar = db.reference("Solicitudes").child(id_solicitud).get() or {}

    #VALIDAMOS QUE LA SOLICITUD EXISTA
    if not solicitud_a_cancelar:
        return JsonResponse({"status": "false","message": "No se pudo encontrar la solicitud."}, status=404)

    #VALIDAMOS QUE LA SOLICITUD PERTENEZCA AL USUARIO
    rut_usuario_solicitud = solicitud_a_cancelar.get("id_rut")

    if rut_usuario_actual != rut_usuario_solicitud:
        registrar_auditoria_manual(request, "Cuatro", "false", f"El usuario {rut_usuario_actual} intento eliminar una solicitud que no le pertenece {rut_usuario_solicitud}.")
        return JsonResponse({"status": "false","message": "Esa no es su solicitud."}, status=403)
    
    if solicitud_a_cancelar.get("Estado") != "pendiente":
        registrar_auditoria_manual(request, "Cuatro", "false", f"El usuario {rut_usuario_actual} intento eliminar una solicitud que no esta en estado pendiente.")
        return JsonResponse({"status": "false","message": "Esa solicitud ya fue resuelta."}, status=403)

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
            return JsonResponse({"status": "false","message": f"Error al eliminar el archivo: {e}"}, status=500)

    #AHORA SE ELIMINA DE FIREBASE
    db.reference('/Solicitudes/'+id_solicitud).delete()
    registrar_auditoria_manual(request, "Cuatro", "éxito", f"El usuario {rut_usuario_actual} ha eliminado su solicitud {solicitud_a_cancelar.get("Asunto")} con éxito.")
    return JsonResponse({"status": "success","message": "Solicitud cancelada (eliminada)."}, status=200)

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
    
    tipo_id = solicitud_a_ver.get("tipo_solicitud")
    tipo_solicitud_nombre = "Desconocido"
    
    if tipo_id:
        try:
            # Intentamos obtener el nodo completo del TipoSolicitud
            tipo_data = db.reference("TiposSolicitud").child(tipo_id).get()
            
            if tipo_data and isinstance(tipo_data, dict):
                 tipo_solicitud_nombre = tipo_data.get("nombre", "Tipo no encontrado")
            
        except Exception as e:
            print(f"Error al obtener el nombre del tipo {tipo_id}: {e}")
            tipo_solicitud_nombre = "Error de base de datos"

    solicitud_a_ver["tipo_solicitud_nombre"] = tipo_solicitud_nombre

    #OBTENER LOS DETALLES DE LA SOLICITUD Y DEVOLVERLOS
    return JsonResponse({"status": "success", "message": "Solicitud obtenida", "solicitud": solicitud_a_ver}, status=200)

@csrf_exempt
@require_POST
@firebase_auth_required
def crear_solicitud(request):
    #OBTENEMOS LAS VARIABLES DEL FORM
    tipo_solicitud = request.POST.get("tipos_solicitud", None)
    asunto = request.POST.get("asunto", None)
    descripcion = request.POST.get("descripcion", None)
    archivo = request.FILES.get("archivo", None)

    #OBTENEMOS LA INFORMACION DEL USUARIO ACTUAL (QUE HAYA INICIADO SESION)
    rut_usuario_actual = request.rut_usuario_actual

    #VALIDAMOS QUE LOS CAMPOS NO ESTEN VACIOS
    if not all([tipo_solicitud, asunto, descripcion]):
        return JsonResponse({"status": "false","error": "Los campos obligatorios no pueden estar vacíos."}, status=400)
    
    #OBTENEMOS EL ID DE LA SOLICITUD
    try:
        ref = db.reference('/Solicitudes').push()
        id_solicitud = ref.key
    except Exception:
        # Error si Firebase DB no está accesible
        return JsonResponse({"status": "false","error": "Error al generar ID de solicitud."}, status=500)

    #VALIDAMOS EXISTENCIA DE UN ARCHIVO (SI NO HAY LO DEJAMOS COMO "None")
    urlArchivo = None
    archivoName = None
    if archivo:
        #SI ES QUE HAY ARCHIVO SE SUBE A STORAGE
        try:
            ext = archivo.name.split(".")[-1].lower()
            if ext not in ["jpg", "jpeg", "png", "pdf", "doc", "docx"]:
                return JsonResponse({"status": "false","error": "Formato de archivo no permitido."}, status=415)
            
            bucket = storage.bucket()
            blob = bucket.blob(f"{rut_usuario_actual}/Solicitudes/{id_solicitud}/{archivo.name}")

            archivoName = archivo.name

            blob.upload_from_file(archivo, content_type=archivo.content_type)
            blob.cache_control = "public, max-age=3600, s-maxage=86400"
            blob.patch()
            
            urlArchivo = blob.generate_signed_url(
                expiration=timedelta(weeks=150),
                method="GET"
            )
        except Exception as e:
            return JsonResponse({"status": "false","error": f"Error al procesar el archivo: {e}"}, status=500)
    
    #AHORA LO CREAMOS EN FIREBASE
    try:
        ref.set({
            "Asunto": asunto,
            "Descripcion": descripcion,
            "Estado": "pendiente",
            "Fecha_fin": "null", 
            "Fecha_inicio": "null",
            "Fecha_solicitud": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            "id_aprobador": "null", 
            "id_rut": rut_usuario_actual,
            "tipo_solicitud": tipo_solicitud,
            "archivo": urlArchivo,
            "archivo_name": archivoName
        })
    except Exception as e:
        ref.delete()
        return JsonResponse({"status": "false","error": f"Error al guardar en la base de datos: {e}"}, status=500)

    registrar_auditoria_manual(request, "Dos", "éxito", f"Se crea la solicitud {asunto} del usuario {rut_usuario_actual}.")

    return JsonResponse({"status": "success", "message": "Solicitud creada con éxito.", "id": id_solicitud}, status=201)

@csrf_exempt
@require_GET
@firebase_auth_required
def obtener_tipos_solicitud(request):
    
    try:
        tipo_solicitud = db.reference("TiposSolicitud").get() or {}

        if not tipo_solicitud:
            return JsonResponse({"status": "false","message": "No se pudo encontrar la solicitud."}, status = 404)
    except Exception as e:
        return JsonResponse({"status": "false","message": "Ocurrio un error al obtener los tipos de solicitud."}, status = 500)

    tipos_list = []
    for key, value in tipo_solicitud.items():
        tipos_list.append({
            "id": key,
            "nombre": value.get("nombre", "Sin nombre")
        })

    return JsonResponse({"status": "success","tipos": tipos_list}, status = 200)


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
