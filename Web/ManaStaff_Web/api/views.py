from django.http import JsonResponse, HttpResponse, StreamingHttpResponse
from staffweb.firebase import auth, db, storage
from django.views.decorators.http import require_POST,require_GET, require_http_methods
from django.views.decorators.csrf import csrf_exempt
from urllib.parse import unquote_plus, urlparse
from staffweb.utils.auditoria import registrar_auditoria_movil
from staffweb.utils.decorators import firebase_auth_required
from staffweb.utils.email_utils import enviar_correo
from datetime import datetime, timedelta
import os
import mimetypes
import requests
import re
import random
import string
#----------------------------------- SESIÓN -----------------------------------

def generar_codigo(length=6):
    return ''.join(random.choices(string.digits, k=length))


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
        registrar_auditoria_movil(request, "Cuatro", "false", f"El usuario {rut_usuario_actual} intento eliminar una solicitud que no le pertenece {rut_usuario_solicitud}.")
        return JsonResponse({"status": "false","message": "Esa no es su solicitud."}, status=403)
    
    if solicitud_a_cancelar.get("Estado") != "pendiente":
        registrar_auditoria_movil(request, "Cuatro", "false", f"El usuario {rut_usuario_actual} intento eliminar una solicitud que no esta en estado pendiente.")
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
    registrar_auditoria_movil(request, "Cuatro", "éxito", f"El usuario {rut_usuario_actual} ha eliminado su solicitud {solicitud_a_cancelar.get("Asunto")} con éxito.")
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
        registrar_auditoria_movil(request, "Cuatro", "false", f"El usuario {rut_usuario_actual} intento ver el detalle de una solicitud que no le pertenece {rut_usuario_solicitud}.")
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

    registrar_auditoria_movil(request, "Dos", "éxito", f"Se crea la solicitud {asunto} del usuario {rut_usuario_actual}.")

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

@csrf_exempt
@require_GET
@firebase_auth_required
def obtener_publicacion(request):

    ref = db.reference("Anuncio").get() or {}

    # 🔄 Convertir a lista
    tipo_anuncio = db.reference("TipoAnuncio").get() or {}
    anuncios_list = []
    for key, value in ref.items():

        tipo_nombre = "Sin tipo"
        id_tipo = "Sin id tipo"
        for key_tipo, value_tipo in tipo_anuncio.items():
            if key_tipo == value.get("TipoAnuncio"):
                tipo_nombre = value_tipo.get("nombre")
                id_tipo = key_tipo
                break

        contenido = value.get("contenido", "") or ""
        resumen = contenido[:50] + "..." if len(contenido) > 50 else contenido

        anuncios_list.append({
            "id": key,
            "contenido": contenido,
            "resumen": resumen,
            "fecha_emitida": value.get("fecha_emitida"),
            "id_empleador": value.get("id_empleador"),
            "titulo": value.get("titulo"),
            "tipo_anuncio_nombre": tipo_nombre,
            "tipo_anuncio_id": id_tipo
        })

    return JsonResponse({"status":"success", "anuncios": anuncios_list}, status = 200)

@csrf_exempt
@require_GET
@firebase_auth_required
def detalle_publicacion(request, id_anuncio):
    #OBTENEMOS LA SOLICITUD A ELIMINAR
    publicacion_a_ver = db.reference("Anuncio").child(id_anuncio).get() or {}

    #VALIDAMOS QUE LA SOLICITUD EXISTA
    if not publicacion_a_ver:
        return JsonResponse({"error": "No se pudo encontrar la publicación."}, status=404)
    
    tipo_id = publicacion_a_ver.get("TipoAnuncio")
    tipo_publicacion_nombre = "Desconocido"
    
    if tipo_id:
        try:
            # Intentamos obtener el nodo completo del TipoSolicitud
            tipo_data = db.reference("TipoAnuncio").child(tipo_id).get()
            
            if tipo_data and isinstance(tipo_data, dict):
                 tipo_publicacion_nombre = tipo_data.get("nombre", "Tipo no encontrado")
            
        except Exception as e:
            tipo_publicacion_nombre = "Error de base de datos"

    publicacion_a_ver["tipo_publicacion_nombre"] = tipo_publicacion_nombre

    #OBTENER LOS DETALLES DE LA SOLICITUD Y DEVOLVERLOS
    return JsonResponse({"status": "success", "message": "Publicacion obtenida", "publicacion": publicacion_a_ver}, status=200)


#----------------------------------- DOCUMENTOS -----------------------------------

@csrf_exempt
@require_GET
@firebase_auth_required
def obtener_documentos(request):
    
    rut_usuario_actual = request.rut_usuario_actual

    ref = db.reference("Documentos").order_by_child("id_rut").equal_to(rut_usuario_actual).get() or {}

    # 🔄 Convertir a lista
    tipo_estado = db.reference("Tipoestado").get() or {}
    documentos_list = []
    for key, value in ref.items():

        tipo_nombre = "Sin tipo"
        id_tipo = "Sin id tipo"

        tipo_solicitud_id = value.get("Tipoestado")

        for key_tipo, value_tipo in tipo_estado.items():
            if key_tipo == tipo_solicitud_id:
                tipo_nombre = value_tipo
                id_tipo = key_tipo
                break

        documentos_list.append({
            "id": key,
            "Fecha_emitida": value.get("Fecha_emitida"),
            "id_empleador": value.get("id_empleador"),
            "nombre": value.get("nombre"),
            "storage_bucket": value.get("storage_bucket"),
            "storage_path": value.get("storage_path"),
            "tamano_archivo": value.get("tamano_archivo"),
            "tipo_documento": value.get("tipo_documento"),
            "url": value.get("url"),
            "Tipoestado": id_tipo,
            "tipo_estado_nombre": tipo_nombre
        })

    return JsonResponse({"status":"success", "documentos": documentos_list}, status = 200)

@csrf_exempt
@require_GET
@firebase_auth_required
def descargar_documento(request, id_doc):
    
    rut_usuario_actual = request.rut_usuario_actual

    #Obtener Documento a descargar
    documentos_ref = db.reference("Documentos/"+id_doc).get() or {}

    rut_id_documento = documentos_ref.get("id_rut")
    nombre= documentos_ref.get("nombre", "documento")
    url = documentos_ref.get("url")

    storage_bucket = documentos_ref.get("storage_bucket")
    storage_path = documentos_ref.get("storage_path")

    if not storage_path or not storage_bucket:
        return JsonResponse({"status":"error", "message": "Ruta de archivo no encontrada en el documento."}, status = 404)

    #Validar descarga (Si es de RRHH o Empleado)
    usuario_actual = db.reference("Usuario/"+rut_usuario_actual).get() or {}
    rol_usuario_actual = usuario_actual.get("rol")

    if rol_usuario_actual != "Uno" and (rut_usuario_actual != rut_id_documento):
        registrar_auditoria_movil(request, "Cinco", "fallo", f"Intento de descarga no autorizado del documento {nombre} por {rut_usuario_actual}.")
        return JsonResponse({"status":"error", "message": "Usted no es de Recursos Humanos ni es su documento."}, status = 403) 

    try:   
        response = requests.get(url, stream=True)
        if response.status_code != 200:
            return HttpResponse("No se pudo descargar el documento", status=500)

        content_length = response.headers.get('Content-Length')

        nombre_archivo = url.split("/")[-1]
        nombre_archivo = str(nombre_archivo.split("?")[0])
        nombre_archivo = unquote_plus(nombre_archivo)

        prefix = id_doc + "/"

        ultimo_segmento = nombre_archivo.split(prefix, 1)[-1]
        
        
        tipo_mime, _ = mimetypes.guess_type(nombre_archivo)
        if not tipo_mime:
            tipo_mime = 'application/octet-stream' 

        resp = StreamingHttpResponse(response.iter_content(chunk_size=8192), content_type=tipo_mime)
        
        resp['Content-Disposition'] = f'attachment; filename="{ultimo_segmento}"'
        
        if content_length:
            resp['Content-Length'] = content_length

        registrar_auditoria_movil(request, "Cinco", "éxito", f"El usuario {rut_usuario_actual} descargó el documento {nombre}.")
        return resp
    
    except Exception as e:
        registrar_auditoria_movil(request, "Cinco", "error", f"Error al generar URL para el documento {nombre}: {str(e)}")
        return JsonResponse({"status":"error", "message": f"Error interno al preparar la descarga: {str(e)}"}, status = 500)

@csrf_exempt
@require_POST
@firebase_auth_required
def verificar_pin(request):

    pin_post = request.POST.get("pin", None)
    rut_usuario_actual = request.rut_usuario_actual

    #Obtener Documento a descargar
    usuario_db = db.reference("Usuario/"+rut_usuario_actual) or {}
    usuario_ref = usuario_db.get()

    pin_actual= usuario_ref.get("PIN", "")

    if not pin_post or not pin_actual:
        return JsonResponse({"status":"error", "message": "No se encontro ningún PIN."}, status = 404)

    if not pin_post or len(pin_post) != 4 or not pin_post.isdigit():
        return JsonResponse({"status": "error", "message": "PIN inválido."}, status=400)

    if pin_post and pin_actual and str(pin_post) == str(pin_actual):
        return JsonResponse({"status": 'success', 'message': "PIN validado."}, status=200)
    else:
        return JsonResponse({"status": 'success', "message": "PIN incorrecto."}, status=403)

#----------------------------------- USUARIOS / PERFIL -----------------------------------

@csrf_exempt
@require_POST
@firebase_auth_required
def actualizar_perfil(request):
    nuevo_celular = request.POST.get("celular", None) 
    nueva_direccion = request.POST.get("direccion", None)
    nueva_imagen = request.FILES.get("imagen", None)

    rut_usuario_actual = request.rut_usuario_actual
    
    if not nuevo_celular or not nueva_direccion:
        registrar_auditoria_movil(request, "Tres", "error", f"El usuario {rut_usuario_actual} intento modificar perfil con campos vaciós (Dirección o Telefono).")
        return JsonResponse({"status":"error", "message": "Los campos dirección y|o teléfono no pueden estar vacíos."}, status = 404)

    patron_chileno = re.compile(r"^\+56\s9\s\d{4}\s\d{4}$")

    if not patron_chileno.match(nuevo_celular.strip()):
        registrar_auditoria_movil(request, "Tres", "error", f"El usuario {rut_usuario_actual} ingresó un número de teléfono inválido: {nuevo_celular}.")
        return JsonResponse({"status": "error", "message": "El teléfono debe tener formato chileno válido: +56 9 1234 5678"}, status=400)
    
    
    try:
        usuario_ref = db.reference("Usuario").child(rut_usuario_actual)
    except Exception as e:
        return JsonResponse({"status": "false", "message": f"Error al buscar usuario: {e}"}, status=500)
    
    usuario_actual = usuario_ref.get() or {}
    imagen_actual_url = (usuario_actual.get('imagen') or '').strip()

    if nueva_imagen:
        # Validación
        ext = nueva_imagen.name.split(".")[-1].lower()
        if ext not in {"jpg", "jpeg", "png", "gif"}:
            registrar_auditoria_movil(request, "Tres", "error", f"El usuario {rut_usuario_actual} intento modificar su imagen actual con un formato no valido (Solo JPG, JPEG, PNG o GIF).")
            return JsonResponse({"status":"error", "message": "Imagen no permitida, debe tener formato JPG, JPEG, PNG o GIF."}, status = 400)

        bucket = storage.bucket()

        # Borrar imagen anterior si existe 
        if imagen_actual_url:
            try:
                parsed = urlparse(imagen_actual_url)
                last_segment = (parsed.path.split('/')[-1] if parsed.path else '').split('?')[0]
                nombre_archivo_viejo = unquote_plus(last_segment) if last_segment else None
                if nombre_archivo_viejo:
                    old_blob = bucket.blob(f"{rut_usuario_actual}/Imagen/{nombre_archivo_viejo}")
                    if old_blob.exists():
                        old_blob.delete()
            except Exception:
                registrar_auditoria_movil(request, "Tres", "error", f"El usuario {rut_usuario_actual} tuvo problemas al eliminar su imagen actual.")
                return JsonResponse({"status":"error", "message": "Ocurrio un error al intenar eliminar la anterior imagen."}, status = 500)

        #Subir la nueva imagen
        try:
            new_blob = bucket.blob(f"{rut_usuario_actual}/Imagen/{nueva_imagen.name}")
            new_blob.upload_from_file(nueva_imagen, content_type=nueva_imagen.content_type)
            new_blob.cache_control = "public, max-age=3600, s-maxage=86400"
            new_blob.patch()

            imagen_actual_url = new_blob.generate_signed_url(
                expiration=timedelta(weeks=150),
                method="GET"
            )
        except Exception as e:
            registrar_auditoria_movil(request, "Tres", "error", f"El usuario {rut_usuario_actual} tuvo problemas al subir su nueva imagen.")
            return JsonResponse({"status":"error", "message": "Ocurrio un error al subir la nueva imagen."}, status = 500)

    # Actualizar datos en Firebase 
    try:
        usuario_ref.update({
            "Telefono": nuevo_celular,
            "Direccion": nueva_direccion,
            "imagen": imagen_actual_url
        })
        registrar_auditoria_movil(request, "Tres", "éxito", f"El usuario {rut_usuario_actual} modifico información de su perfil (Telefono, Dirección y/o Imagen).")
        return JsonResponse({"status":"success", "message": "Perfil de usuario cambiado con éxito."}, status = 200)
    except Exception:
        registrar_auditoria_movil(request, "Tres", "error", f"El usuario {rut_usuario_actual} tuvo problemas al intentar actualizar su usuario (Telefono, Dirección y/o Imagen).")
        return JsonResponse({"status":"error", "message": f"Error al actualizar perfil del usuario {rut_usuario_actual} (Telefono, Dirección y/o Imagen)."}, status = 200)

@csrf_exempt
@require_POST
@firebase_auth_required
def cambiar_contrasena(request):
    password_actual = request.POST.get("password_actual", "").strip()
    password_nueva = request.POST.get("nueva_password", "").strip()
    password_repetir = request.POST.get("confirmar_password", "").strip()
    
    rut_usuario_actual = request.rut_usuario_actual

    if not all([password_actual, password_nueva, password_repetir]):
        registrar_auditoria_movil(request, "Tres", "error", f"El usuario {rut_usuario_actual} intento cambiar su contraseña con campos vacios.")
        return JsonResponse({"status": "false", "message": "Todos los campos son obligatorios."}, status=404)

    if password_nueva != password_repetir:
        return JsonResponse({"status": "false", "message": "Las nuevas contraseñas no coinciden."}, status=400)

    if len(password_nueva) < 6:
        return JsonResponse({"status": "false", "message": "La nueva contraseña debe tener al menos 6 caracteres."}, status=400)

    # Obtener email del usuario según su RUT
    try:
        usuario_ref = db.reference(f"Usuario/{rut_usuario_actual}").get()
    except Exception as e:
        return JsonResponse({"status": "false", "message": f"Error al buscar usuario: {e}"}, status=500)
    if not usuario_ref:
        return JsonResponse({"status": "false", "message": "Usuario no encontrado."}, status=404)

    email = usuario_ref.get("correo")


    try:

        api_key = "AIzaSyDrogTFQNg_BNb1qmkIhJ6cpppzPw-DLOo"
        url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={api_key}"
        payload = {
            "email": email,
            "password": password_actual,
            "returnSecureToken": True
        }
        r = requests.post(url, json=payload)
        resp = r.json()

        if "error" in resp:
            registrar_auditoria_movil(request, "Tres", "false", f"El usuario {rut_usuario_actual} intento cambiar su contraseña con la contraseña actual incorrecta.")
            return JsonResponse({"status": "false", "message": "La contraseña actual es incorrecta."}, status=400)

        # Actualizar contraseña
        user = auth.get_user_by_email(email)
        auth.update_user(user.uid, password=password_nueva)

    except Exception as e:
        return JsonResponse({"status": "false", "message": f"Error al cambiar contraseña: {e}"}, status=500)
    
    registrar_auditoria_movil(request, "Tres", "éxito", f"El usuario {rut_usuario_actual} cambio su contraseña exitosamente.")
    return JsonResponse({"status": "success", "message": "Contraseña actualizada correctamente."}, status=200)

@csrf_exempt
@require_POST
@firebase_auth_required
def cambiar_pin(request):
    pin_actual = request.POST.get("pin_actual", "").strip()
    pin_nueva = request.POST.get("pin_nueva", "").strip()
    pin_confirmar = request.POST.get("pin_confirmar", "").strip()

    rut_usuario_actual = request.rut_usuario_actual

    if not all([pin_actual, pin_nueva, pin_confirmar]):
        registrar_auditoria_movil(request, "Tres", "error", f"El usuario {rut_usuario_actual} intento cambiar su PIN con campos vacios.")
        return JsonResponse({"status": "false", "message": "Todos los campos son obligatorios."}, status=400)

    if pin_nueva != pin_confirmar:
        return JsonResponse({"status": "false", "message": "Los nuevos pin no coinciden."}, status=400)
    
    if not (pin_actual.isdigit() and pin_nueva.isdigit() and pin_confirmar.isdigit()):
        registrar_auditoria_movil(request, "Tres", "error", f"El usuario {rut_usuario_actual} intento cambiar su PIN con un valor no numérico.")
        return JsonResponse({"status": "false", "message": "El PIN debe ser estrictamente numérico."}, status=400)

    if len(pin_nueva) !=4:
        return JsonResponse({"status": "false", "message": "El nuevo pin debe tener 4 números."}, status=400)

    try:
        usuario_ref = db.reference(f"Usuario/{rut_usuario_actual}").get()
    except Exception as e:
        return JsonResponse({"status": "false", "message": f"Error al buscar usuario: {e}"}, status=500)
    
    if not usuario_ref:
        return JsonResponse({"status": "false", "message": "Usuario no encontrado."}, status=404)

    try:
        pin_usuario_actual=usuario_ref.get("PIN")
        if pin_actual != pin_usuario_actual:
            registrar_auditoria_movil(request, "Tres", "false", f"El usuario {rut_usuario_actual} intento cambiar su PIN con el PIN actual incorrecto.")
            return JsonResponse({"status": "false", "message": "El pin actual es incorrecto."}, status=400)
        
        ref= db.reference(f"/Usuario/{rut_usuario_actual}")
        ref.update({
            "PIN":pin_nueva
        })

    except Exception as e:
        return JsonResponse({"status": "false", "message": f"Error al cambiar pin: {e} por un error: {e}."}, status=500)
    registrar_auditoria_movil(request, "Tres", "éxito", f"El usuario {rut_usuario_actual} cambio su PIN exitosamente.")
    return JsonResponse({"status": "success", "message": "Pin actualizado correctamente."}, status=200)

@csrf_exempt
@require_POST
@firebase_auth_required
def solicitar_recuperacion_pin(request):
    email = request.POST.get('email')
    if not email:
        return JsonResponse({"status": "false", "message": "Debes ingresar un correo."}, status=400)

    # Validar que el usuario actual y el correo a cambiar coincidan
    
    rut_usuario_actual = request.rut_usuario_actual

    try:
        correo_actual = db.reference("Usuario").child(rut_usuario_actual).get().get('correo')
    except Exception as e:
        return JsonResponse({"status": "false", "message": f"Error al buscar correo actual: {e}"}, status=500)

    if not correo_actual or not rut_usuario_actual:
        return JsonResponse({"status": "false", "message": "Usuario actual no encontrado"}, status=404)

    if email != correo_actual:
        registrar_auditoria_movil(request, "Seis", "false", f"El usuario {rut_usuario_actual} solicito recuperación de PIN con correo incorrecto.")
        return JsonResponse({"status": "false", "message": "El correo actual no coincide con el del envío."}, status=400)

    # Generar código temporal
    codigo = generar_codigo()
    expiracion = (datetime.now() + timedelta(minutes=10)).isoformat()

    # Guardar OTP en Firebase
    db.reference(f"RecuperacionPIN/{rut_usuario_actual}").set({
        "codigo": codigo,
        "expira": expiracion
    })

    asunto = "Recuperación de PIN"
    texto = f"Tu código de recuperación es: {codigo}. Válido por 10 minutos."
    html = f"""
    <div style="font-family: Arial, sans-serif; color: #333;">
    <h2 style="color: #1cc88a;">Recuperación de PIN</h2>
    <p>Tu código de recuperación es:</p>
    <p style="background-color:#f2f2f2; padding:10px; border-radius:5px; font-size:18px;">
        <strong>{codigo}</strong>
    </p>
    <p>Válido por 10 minutos.</p>
    </div>
    """

    enviar_correo(email, asunto, texto, html)

    registrar_auditoria_movil(request, "Seis", "éxito", f"El usuario {rut_usuario_actual} solicito un codigo de recuperación de PIN.")
    return JsonResponse({"status": "success", "message": "Código enviado a tu correo."},status=200)

@csrf_exempt
@require_POST
@firebase_auth_required
def verificar_codigo_recuperacion(request):
    email = request.POST.get("email")
    codigo_ingresado = request.POST.get("codigo")

    if not email or not codigo_ingresado:
        return JsonResponse({"status": "false", "message": "Faltan datos (codigo o email)."}, status=400)
    
    rut_usuario_actual = request.rut_usuario_actual

    try:
        correo_actual = db.reference("Usuario").child(rut_usuario_actual).get().get('correo')
    except Exception as e:
        return JsonResponse({"status": "false", "message": f"Error al buscar correo actual: {e}"}, status=500)

    if not correo_actual or not rut_usuario_actual:
        return JsonResponse({"status": "false", "message": "Usuario actual no encontrado"}, status=404)

    if email != correo_actual:
        registrar_auditoria_movil(request, "Seis", "false", f"El usuario {rut_usuario_actual} intento verificar codigo de recuperación de PIN con un correo incorrecto.")
        return JsonResponse({"status": "false", "message": "El correo actual no coincide con el cuál se le envio el codigo."}, status=400)

    # Obtener código guardado
    otp_ref = db.reference(f"RecuperacionPIN/{rut_usuario_actual}").get()
    if not otp_ref:
        return JsonResponse({"status": "false", "message": "No hay código generado. Solicita uno."}, status=400)

    codigo_valido = otp_ref.get("codigo")
    expiracion = datetime.fromisoformat(otp_ref.get("expira"))

    if datetime.now() > expiracion:
        return JsonResponse({"status": "false", "message": "El código ha expirado."}, status=400)

    if codigo_ingresado != codigo_valido:
        return JsonResponse({"status": "false", "message": "Código incorrecto."}, status=400)
    
    registrar_auditoria_movil(request, "Seis", "éxito", f"El usuario {rut_usuario_actual} valido su código de recuperación de PIN.")

    return JsonResponse({"status": "success", "message": "Codigo validado, cambie su PIN"}, status=200)

@csrf_exempt
@require_POST
@firebase_auth_required
def cambiar_PIN_verificado(request):
    email = request.POST.get("email")
    nuevo_pin = request.POST.get("nuevo_pin")
    codigo = request.POST.get("codigo")
    

    if not email or not nuevo_pin or not codigo:
        return JsonResponse({"status": "false", "message": "Faltan datos."}, status=400)
    
    rut_usuario_actual = request.rut_usuario_actual

    if not nuevo_pin.isdigit() or len(nuevo_pin) != 4:
        return JsonResponse({"status": "false", "message": "El PIN debe tener 4 dígitos numéricos."}, status=400)

    try:
        correo_actual = db.reference("Usuario").child(rut_usuario_actual).get().get('correo')
    except Exception as e:
        return JsonResponse({"status": "false", "message": f"Error al buscar correo actual: {e}"}, status=500)

    if not correo_actual or not rut_usuario_actual:
        return JsonResponse({"status": "false", "message": "Usuario actual no encontrado"}, status=404)

    if email != correo_actual:
        registrar_auditoria_movil(request, "Seis", "false", f"El usuario {rut_usuario_actual} intento cambiar código de PIN con un correo incorrecto.")
        return JsonResponse({"status": "false", "message": "El correo actual no coincide con el cuál se le envio el codigo."}, status=400)

    # Verificar que exista un OTP válido para este usuario
    otp_ref = db.reference(f"RecuperacionPIN/{rut_usuario_actual}").get()
    if not otp_ref:
        return JsonResponse({"status": "false", "message": "No hay código válido. Solicita uno primero."}, status=400)

    codigo_valido = otp_ref.get("codigo")
    expiracion = datetime.fromisoformat(otp_ref.get("expira"))

    if datetime.now() > expiracion:
        registrar_auditoria_movil(request, "Seis", "false", f"El usuario {rut_usuario_actual} intento cambiar su PIN con un código expirado.")
        return JsonResponse({"status": "false", "message": "El código ha expirado."}, status=400)

    if codigo != codigo_valido:
        registrar_auditoria_movil(request, "Seis", "false", f"El usuario {rut_usuario_actual} intento cambiar su PIN con un código incorrecto.")
        return JsonResponse({"status": "false", "message": "Código incorrecto."}, status=400)

    # Todo correcto, actualizar PIN
    try:
        db.reference(f"Usuario/{rut_usuario_actual}").update({
            "PIN": nuevo_pin
        })
    except Exception as e:
        return JsonResponse({"status": "false", "message": f"Error al actualizar PIN: {e}"}, status=500)

    # Borrar OTP después de usar
    try:
        db.reference(f"RecuperacionPIN/{rut_usuario_actual}").delete()
    except Exception as e:
        return JsonResponse({"status": "false", "message": f"Error al eliminar código de recuperación: {e}"}, status=500)
    

    registrar_auditoria_movil(request, "Seis", "éxito", f"El usuario {rut_usuario_actual} cambio su PIN a través de 'Código de Recuperación de PIN' exitosamente.")
    return JsonResponse({"status": "success", "message": "PIN actualizado correctamente."}, status=200)

