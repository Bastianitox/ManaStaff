import re
from django.shortcuts import render, redirect
from django.views.decorators.http import require_POST,require_GET
from requests.exceptions import HTTPError
from datetime import datetime, timedelta
from django.http import JsonResponse
import json
import re
import base64
from urllib.parse import unquote_plus

from .firebase import authP, auth, database, storage, db


@require_POST
def iniciarSesion(request):
    request.session.flush()

    email = request.POST.get('email', None)
    password = request.POST.get('password', None)

    # VALIDAR CAMPOS VACIOS
    if not email or not password:
        return render(request, 'staffweb/index.html', {"mensaje": "Los campos correo y/o contraseña están vacíos."})
    email = str(email).lower()
    # VALIDAR FORMATO DE CORREO
    patron_correo = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    if not re.match(patron_correo, email):
        return render(request, 'staffweb/index.html', {"mensaje": "El correo es inválido."})

    # VERIFICAR QUE EL CORREO EXISTA EN REALTIME DATABASE
    usuario = database.child("Usuario").order_by_child("correo").equal_to(email).get().val() or {}

    usuarioDATABASE = database.child("Usuario").order_by_child("correo").equal_to(email).get().val() or {}
    if not usuarioDATABASE:
        return render(request, 'staffweb/index.html', {"mensaje": "El correo no está registrado."})

    # INICIAR SESION USANDO PYREBASE
    try:
        user = authP.sign_in_with_email_and_password(email, password)
        id_token = user['idToken']
        refresh_token = user['refreshToken']

        # GUARDAR TOKENS EN LA SESION
        request.session['firebase_id_token'] = id_token
        request.session['firebase_refresh_token'] = refresh_token

        uid = user['localId']
        request.session['usuario_id'] = uid


    except HTTPError as e:
        #VALIDAR QUE EL USUARIO Y CONTRASEÑA SEAN CORRECTOS
        error_json = e.args[1]
        error_message = error_json['error']['message']

        if error_message in ["INVALID_PASSWORD", "EMAIL_NOT_FOUND"]:
            mensaje = "Correo o contraseña incorrectos."
        elif error_message == "TOO_MANY_ATTEMPTS_TRY_LATER":
            mensaje = "Demasiados intentos de inicio de sesión, intente más tarde o reinicie su contraseña."
        else:
            mensaje = "Error de autenticación: " + error_message

        return render(request, 'staffweb/index.html', {"mensaje": mensaje})

    except Exception:
        return render(request, 'staffweb/index.html', {"mensaje": "Error de autenticación con Firebase."})

    # inicio correcto → guardar datos del usuario
    for id_usu, usuario in usuarioDATABASE.items():

        #ACTUALIZAR ULTIMO_LOGIN
        usuario_ref = database.child("Usuario").child(id_usu)
        usuario_ref.update({"Ultimo_login": datetime.now().isoformat()})

        #OBTENER EL NOMBRE DEL CARGO
        cargo_id = usuario.get("Cargo")

        cargo_data = database.child("Cargo").child(cargo_id).get()
        cargo_nombre = cargo_data.val().get("Nombre") if cargo_data.val() else "Sin cargo"

        # URL de la imagen
        url_imagen = usuario.get('imagen', '/static/default.png')

        # Guardamos el rut del usuario en la sesión para reutilizarlo en otras vistas.
        rut_usuario = usuario.get('id_rut') or usuario.get('Rut') or usuario.get('rut') or id_usu
        rut_usuario = re.sub(r'[^0-9]', '', str(rut_usuario or ''))
        request.session['usuario_rut'] = rut_usuario

        request.session['usuario_id'] = id_usu
        request.session['nombre_usu'] = usuario.get('Nombre', '')
        request.session['apellido_usu'] = usuario.get('ApellidoPaterno', '')
        request.session['correo_usu'] = usuario.get('correo', '')
        request.session['cargo_usu'] = cargo_nombre
        request.session['logeado'] = True
        request.session['url_imagen_usuario'] = usuario.get('imagen', '/static/default.png')
        request.session['rol_usu'] = usuario.get('Rol', '')

        return redirect("inicio_documentos")

@require_GET
def cerrarSesion(request):
    request.session.flush()
    return redirect("index")

def obtener_usuarios(request):
    # OBTENER LOS USUARIOS DE LA BASE DE DATOS
    usuarios = database.child("Usuario").get().val() or {}

    usuarios_lista = []
    for id_usu, usuario in usuarios.items():
        # OBTENER EL NOMBRE DEL CARGO
        cargo_id = usuario.get("Cargo")
        cargo_data = database.child("Cargo").child(cargo_id).get()
        cargo_nombre = cargo_data.val().get("Nombre") if cargo_data.val() else "Sin cargo"

        # NOMBRE COMPLETO
        nombre_completo = f"{usuario.get('Nombre', '')} {usuario.get('ApellidoPaterno', '')} {usuario.get('ApellidoMaterno', '')}".strip()

        # FECHA CREACIÓN DESDE LA BD
        fecha_creacion_str = usuario.get("Fecha_creacion")
        created_date = "Sin fecha"
        sort_date = None
        if fecha_creacion_str:
            try:
                fecha_creacion = datetime.fromisoformat(fecha_creacion_str)
                created_date = fecha_creacion.strftime("%d %B, %Y")  # Ej: "15 Enero, 2024"
                sort_date = fecha_creacion.date().isoformat()        # Ej: "2024-01-15"
            except ValueError:
                created_date = fecha_creacion_str  # Dejar como viene si no es ISO

        usuarios_lista.append({
            "rut": id_usu,
            "rut_normal": formatear_rut(id_usu),
            "name": nombre_completo,
            "email": usuario.get("correo", ""),
            "position": cargo_nombre,
            "createdDate": created_date,
            "sortDate": sort_date or fecha_creacion_str
        })

    return JsonResponse({'mensaje': 'Usuarios listados.', 'usuarios': usuarios_lista})

def obtener_usuario(request):
    rut = request.GET.get("id")
    if not rut:
        return JsonResponse({"status": "error", "message": "RUT no especificado"}, status=400)

    # Obtener usuario
    usuario_data = database.child(f"Usuario/{rut}").get().val()
    if not usuario_data:
        return JsonResponse({"status": "error", "message": "Usuario no encontrado"}, status=404)

    # Obtener cargo
    cargo_id = usuario_data.get("Cargo")
    cargo_data = database.child("Cargo").child(cargo_id).get().val()
    cargo_nombre = cargo_data.get("Nombre") if cargo_data else "Sin cargo"

    usuario_json = {
        "Nombre": usuario_data.get("Nombre", ""),
        "Segundo_nombre": usuario_data.get("Segundo_nombre", ""),
        "ApellidoPaterno": usuario_data.get("ApellidoPaterno", ""),
        "ApellidoMaterno": usuario_data.get("ApellidoMaterno", ""),
        "Telefono": usuario_data.get("Telefono", ""),
        "Direccion": usuario_data.get("Direccion", ""),
        "correo": usuario_data.get("correo", ""),
        "Cargo": cargo_id,
        "cargo_nombre": cargo_nombre,
        "imagen": usuario_data.get("imagen", ""),
        "rol": usuario_data.get("rol", ""),
        "PIN": usuario_data.get("PIN", ""),
        "Fecha_creacion": usuario_data.get("Fecha_creacion", ""),
        "rut": rut,
        "rut_normal": formatear_rut(rut),
    }

    return JsonResponse({"status": "success", "usuario": usuario_json})

def obtener_usuario_actual(request):
    rut = request.session.get("usuario_id")
    if not rut:
        return JsonResponse({"status": "error", "message": "Usuario no autenticado"}, status=401)

    usuario_data = database.child(f"Usuario/{rut}").get().val()
    if not usuario_data:
        return JsonResponse({"status": "error", "message": "Usuario no encontrado"}, status=404)

    return JsonResponse({
        "status": "success",
        "usuario": {
            "rut": rut,
            "Nombre": usuario_data.get("Nombre", ""),
            "correo": usuario_data.get("correo", ""),
            "rol": usuario_data.get("rol", "")
        }
    })

@require_POST
def crear_usuario_funcion(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"status": "false", "message": "JSON inválido."})

    # Obtener campos desde JSON
    nombre = data.get("nombre")
    segundo_nombre = data.get("segundo_nombre")
    apellido_paterno = data.get("apellido_paterno")
    apellido_materno = data.get("apellido_materno")
    rut = data.get("rut")
    celular = data.get("celular")
    direccion = data.get("direccion")
    email = data.get("email")
    cargo = data.get("cargo")
    rol = data.get("rol")
    pin = data.get("pin")
    password = data.get("password")
    imagen_base64 = data.get("imagen") 

    # VALIDAR CAMPOS VACIOS
    if not all([nombre, segundo_nombre,apellido_paterno, apellido_materno, rut,celular, direccion,cargo,rol, imagen_base64, pin, email, password]):
        return JsonResponse({"status": "false", "message": "Los campos no pueden estar vacíos."})

    # Validación de RUT (simple)
    import re
    patron_rut = r"^\d{1,2}\.?\d{3}\.?\d{3}-[\dkK]$"
    if not re.match(patron_rut, rut):
        return JsonResponse({"status": "false", "message": "El RUT ingresado no es válido."})



    # Validación de correo
    patron_email = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    if not re.match(patron_email, email):
        return JsonResponse({"status": "false", "message": "El correo electrónico no es válido."})
    email = str(email).lower()
    if correo_ya_existe(email):
        return JsonResponse({"status": "false", "message": "El correo electrónico ya existe."})


    # Validación de contraseña (mínimo 6 caracteres para Firebase)
    if len(password) < 6:
        return JsonResponse({"status": "false", "message": "La contraseña debe tener al menos 6 caracteres."})

    #VALIDAR TELEFENO EN FORMATO CHILENO (+56 9 1234 5678)
    if celular and not re.match(r'^\+56 9 \d{4} \d{4}$', celular):
        return JsonResponse({"status": "false", "message": "El número de celular debe tener el formato: +56 9 1234 5678"})

    
    #OBTENER EL RUT LIMPIO DEL USUARIO
    rut_limpio = rut.replace(".", "").replace("-", "")

    # VALIDAR QUE EL RUT NO EXISTA
    usuario_ref = database.child("Usuario").child(rut_limpio).get()
    if usuario_ref.val() is not None:
        return JsonResponse({"status": "false", "message": "El RUT ya existe."})

    #CACHE CONTROL
    cache_control_header = "public, max-age=3600, s-maxage=86400"
    #VALIDACION DE IMAGEN
    try:
        formato, imgstr = imagen_base64.split(';base64,')
        ext = formato.split('/')[-1].lower()
        if ext not in ["jpg", "jpeg", "png", "gif"]:
            return JsonResponse({"status": "false", "message": "Formato de imagen no permitido."})
        
        bucket = storage.bucket()
        blob = bucket.blob(f"{rut_limpio}/Imagen/imagen.{ext}")
        blob.upload_from_string(base64.b64decode(imgstr), content_type=f"image/{ext}")
        blob.cache_control = "public, max-age=3600, s-maxage=86400"
        blob.patch()
        
        urlImagen = blob.generate_signed_url(
            expiration=timedelta(weeks=150),
            method="GET"
        )
    except Exception as e:
        return JsonResponse({"status": "false", "message": f"Error al procesar la imagen: {e}"})

    # CREAR USUARIO EN AUTHENTICATION
    try:
        userFIREBASE = auth.create_user(email=email, password=password)
    except Exception as e:
        return JsonResponse({"status": "false", "message": f"Error al crear usuario en Base de Datos: {e}"})

    #CREAR USUARIO DENTRO DE LA BASE DE DATOS
    ref = database.child(f"Usuario/{rut_limpio}")
    ref.set({
        "Nombre":nombre,
        "Segundo_nombre":segundo_nombre,
        "ApellidoPaterno":apellido_paterno,
        "ApellidoMaterno":apellido_materno,
        "Telefono":celular,
        "Direccion":direccion,
        "correo":email,
        "Cargo":cargo,
        "imagen":urlImagen,
        "rol":rol,
        "PIN":pin,
        "Fecha_creacion": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
    })

    return JsonResponse({"status": "success", "message": "Usuario creado con éxito."})

@require_POST
def eliminar_usuario(request, rut):
    try:
        #Obtener el correo del usuario a traves del rut
        usuario = database.child(f"Usuario/{rut}").get().val()
        correo = usuario["correo"]

        #Obtener el uid del usuario en autenthication a traves de su correo
        uid = auth.get_user_by_email(correo).uid

        #Eliminar el usuario de AUTENTHICATION
        auth.delete_user(uid)

        #Eliminar el usuario de Firebase (por su RUT)
        database.child(f"Usuario/{rut}").remove()

        #Eliminar los archivos del usuario
        eliminar_archivos_usuario(rut)

        # Eliminar solicitudes del usuario
        solicitudes = database.child("Solicitudes").order_by_child("id_rut").equal_to(rut).get()
        if solicitudes.each():
            for solicitud in solicitudes.each():
                database.child("Solicitudes").child(solicitud.key()).remove()

        # Eliminar documentos del usuario
        documentos = database.child("Documentos").order_by_child("id_rut").equal_to(rut).get()
        if documentos.each():
            for doc in documentos.each():
                database.child("Documentos").child(doc.key()).remove()


        return JsonResponse({"status": "success", "message": "Usuario eliminado junto con sus Solicitudes y Documentos correctamente."})
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=400)

def eliminar_archivos_usuario(rut):
    # Validación de entrada
    if not rut or not isinstance(rut, str):
        return {"status": "error", "mensaje": "El RUT proporcionado no es válido."}
    
    try:
        # Referencia al bucket
        bucket = storage.bucket()

        # Listar todos los blobs que empiecen con el rut/
        blobs = list(bucket.list_blobs(prefix=f"{rut}/"))

        if not blobs:
            return {"status": "warning", "mensaje": f"No se encontraron archivos para el RUT {rut}."}

        # Eliminar todos los blobs encontrados
        for blob in blobs:
            blob.delete()

        return {"status": "success", "mensaje": f"Se eliminaron {len(blobs)} archivos del usuario {rut}."}
    except Exception as e:
        return {"status": "error", "mensaje": f"Ocurrió un error al eliminar los archivos: {str(e)}"}

@require_POST
def modificar_usuario_funcion(request, rut):
    #OBTENER CAMPOS MENOS EL RUT (RUT NO SE DEBE EDITAR YA QUE ES UNICO)
    nombre = request.POST.get('nombre', None)
    segundo_nombre = request.POST.get('Segundo_nombre', None)
    apellido_paterno = request.POST.get('apellido_paterno', None)
    apellido_materno = request.POST.get('apellido_materno', None)
    celular = request.POST.get('celular', None)
    direccion = request.POST.get('direccion', None)
    email = request.POST.get('email', None)
    cargo = request.POST.get('cargo', None)
    imagen = request.FILES.get('imagen', None)
    rol = request.POST.get('rol', None)
    pin = request.POST.get('pin', None)
    password = request.POST.get('password', None)

    #OBTENER VALORES DEL USUARIO ACTUAL
    usuario_a_modificar = database.child(f"Usuario/{rut}").get().val()
    correo_actual = usuario_a_modificar.get("correo")
    usuarioAUTH = auth.get_user_by_email(correo_actual)
    uid = usuarioAUTH.uid

    #VALIDACIONES

    # VALIDAR CAMPOS VACIOS
    if not all([nombre, segundo_nombre,apellido_paterno, apellido_materno,celular, direccion, cargo, rol, email]):
        return JsonResponse({"status": "false", "message": "Los campos obligatorios no pueden estar vacíos."})
    
    # Validación de correo
    patron_email = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    if not re.match(patron_email, email):
        return JsonResponse({"status": "false", "message": "El correo electrónico no es válido."})

    #VALIDAR TELEFENO EN FORMATO CHILENO (+56 9 1234 5678)
    if celular and not re.match(r'^\+56 9 \d{4} \d{4}$', celular):
        return JsonResponse({"status": "false", "message": "El número de celular debe tener el formato: +56 9 1234 5678"})

    # Validación de contraseña (mínimo 6 caracteres para Firebase)
    if password:
        if len(password) < 6:
            return JsonResponse({"status": "false", "message": "La contraseña debe tener al menos 6 caracteres."})
        #SI LA CONTRASEÑA FUE CAMBIADA Y ES VALIDADA SE CAMBIA EN EL AUTHENTICATION
        else:
            auth.update_user(uid = uid, password = password)

    # Validación de PIN (mínimo 4 caracteres para Firebase)
    pin_actual = usuario_a_modificar.get("PIN")
    if pin:
        if len(pin) == 4:
            pin_actual = pin
        else:
            return JsonResponse({"status": "false", "message": "El pin debe ser de 4 digitos."})

    #VALIDACION DE IMAGEN
    urlImagen = usuario_a_modificar.get("imagen")
    if imagen:


        ext_permitidas = ["jpg", "jpeg", "png", "gif"]
        ext = imagen.name.split(".")[-1].lower()
        if ext not in ext_permitidas:
            return JsonResponse({"status": "false", "message": "Formato de imagen no permitido. Usa JPG, PNG o GIF."})

        #ELIMINAR IMAGEN ACTUAL DE STORAGE

        bucket = storage.bucket()

        nombre_archivo = urlImagen.split("/")[-1]
        nombre_archivo = str(nombre_archivo.split("?")[0])
        nombre_archivo = unquote_plus(nombre_archivo)

        blob = bucket.blob(f"{rut}/Imagen/{nombre_archivo}")
        try:
            blob.delete()
        except:
            print('Error al eliminar imagen de Database')


        # SUBIR NUEVA IMAGEN A STORAGE
        bucket = storage.bucket()
        blob = bucket.blob(f"{rut}/Imagen/{imagen.name}")
        blob.upload_from_file(imagen, content_type=imagen.content_type)
        blob.cache_control = "public, max-age=3600, s-maxage=86400"
        blob.patch()

        urlImagen = blob.generate_signed_url(
            expiration=timedelta(weeks=150),
            method="GET"
        )
    
    #CAMBIAR CORREO SI ES QUE ES DISTINTO AL ACTUAL EN EL AUTHENTICATOR
    if correo_actual!=email:
        #VALIDAR QUE EL NUEVO CORREO NO EXISTA
        if correo_ya_existe(email):
            return JsonResponse({"status": "false", "message": "El correo electrónico ya existe."})
        #SI NO EXISTE CAMBIAR EL CORREO ACTUAL POR EL NUEVO CORREO
        correo_actual = email
        auth.update_user(uid = uid, email = correo_actual)

    #CAMBIAR LOS NUEVOS VALORES AL USUARIO
    ref = db.reference('/Usuario/'+rut)
    ref.update({
        "Nombre":nombre,
        "Segundo_nombre":segundo_nombre,
        "ApellidoPaterno":apellido_paterno,
        "ApellidoMaterno":apellido_materno,
        "Telefono":celular,
        "Direccion":direccion,
        "correo":email,
        "Cargo":cargo,
        "imagen":urlImagen,
        "rol":rol,
        "PIN":pin_actual,
    })

    return JsonResponse({"status": "success", "message": "Usuario modificado correctamente."})

#SOLICITUDES

def obtener_solicitudes_usuario(request):
    #OBTENER USUARIO ACTUAL
    usuario_actual_rut = request.session.get("usuario_id")

    # OBTENER LOS USUARIOS DE LA BASE DE DATOS
    solicitudes = database.child("Solicitudes").order_by_child("id_rut").equal_to(usuario_actual_rut).get().val() or {}

    solicitudes_lista = []
    for id_solicitud, solicitud in solicitudes.items():

        fecha_solicitud_str = solicitud.get("Fecha_solicitud")
        created_date = "Sin fecha"
        sort_date = None
        if fecha_solicitud_str:
            try:
                fecha_solicitud = datetime.fromisoformat(fecha_solicitud_str)
                created_date = fecha_solicitud.strftime("%d %B, %Y")  # Ej: "15 Enero, 2024"
                sort_date = fecha_solicitud.date().isoformat()        # Ej: "2024-01-15"
            except ValueError:
                created_date = fecha_solicitud_str  # Dejar como viene si no es ISO
        
        tipo_solicitud_id = solicitud.get("tipo_solicitud")
        tipo_solicitud_nombre = database.child("TiposSolicitud").child(tipo_solicitud_id).get().val() or {}
        tipo_solicitud_nombre = tipo_solicitud_nombre.get("nombre")

        solicitudes_lista.append({
            "id_solicitud": id_solicitud,
            "asunto": solicitud.get("Asunto"),
            "descripcion": solicitud.get("Descripcion"),
            "estado": solicitud.get("Estado"),
            "fecha_fin": solicitud.get("Fecha_fin"),
            "fecha_inicio": solicitud.get("Fecha_inicio"),
            "fecha_solicitud": solicitud.get("Fecha_solicitud"),
            "id_aprobador": solicitud.get("id_aprobador"),
            "tipo_solicitud": solicitud.get("tipo_solicitud"),
            "sortDate": sort_date or created_date,
            "archivo": solicitud.get("archivo"),
            "archivo_name": solicitud.get("archivo_name"),
            "tipo_solicitud_nombre": tipo_solicitud_nombre
        })

    return JsonResponse({'mensaje': 'Solicitudes listadas.', 'solicitudes': solicitudes_lista})

@require_POST #SIGNIFICA QUE REQUIRE SER ENVIADO POR FORMULARIO EN METODO POST
def crear_solicitud_funcion(request):
    #OBTENEMOS LAS VARIABLES DEL FORM
    tipo_solicitud = request.POST.get("tipos_solicitud", None)
    asunto = request.POST.get("asunto", None)
    descripcion = request.POST.get("descripcion", None)
    archivo = request.FILES.get("archivo", None) #ARCHIVOS SON DE TIPO FILES PARA EL FORMULARIO

    #OBTENEMOS LA INFORMACION DEL USUARIO ACTUAL (QUE HAYA INICIADO SESION)
    rut_usuario_actual = request.session.get("usuario_id")

    #VALIDAMOS QUE LOS CAMPOS NO ESTEN VACIOS
    if not all([tipo_solicitud, asunto, descripcion]):
        return JsonResponse({"status": "false", "message": "Los campos obligatorios no pueden estar vacíos."})

    #OBTENEMOS EL ID DE LA SOLICITUD
    ref = db.reference('/Solicitudes').push()  #.push() es para crear una id automatica
    id_solicitud = ref.key

    #VALIDAMOS EXISTENCIA DE UN ARCHIVO (SI NO HAY LO DEJAMOS COMO "None")
    urlArchivo = None
    archivoName = None
    if archivo:
        #SI ES QUE HAY ARCHIVO SE SUBE A STORAGE
        try:
            ext = archivo.name.split(".")[-1].lower()
            if ext not in ["jpg", "jpeg", "png", "pdf", "doc", "docx"]:
                return JsonResponse({"status": "false", "message": "Formato de archivo no permitido."})
            
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
            return JsonResponse({"status": "false", "message": f"Error al procesar el archivo: {e}"})
    
    #AHORA LO CREAMOS EN FIREBASE
    ref.set({
        "Asunto":asunto,
        "Descripcion":descripcion,
        "Estado":"pendiente",
        "Fecha_fin": "null",
        "Fecha_inicio": "null",
        "Fecha_solicitud": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        "id_aprobador": "null",
        "id_rut": rut_usuario_actual,
        "tipo_solicitud": tipo_solicitud,
        "archivo": urlArchivo,
        "archivo_name": archivoName
    })
    return JsonResponse({"status": "success", "message": "Solicitud creada con éxito."})

#PARA CANCELAR SOLICITUD SE ELIMINARA DE LA BASE DE DATOS JUNTO CON SUS RESPECTIVOS ARCHIVOS
def cancelar_solicitud_funcion(request, id_solicitud):
    #OBTENEMOS EL ID_SOLICITUD DE ESTA

    #OBTENEMOS EL USUARIO ACTUAL
    usuario_actual_rut = request.session.get("usuario_id")

    #VALIDAMOS QUE HAYA UN USUARIO LOGEADO
    if not usuario_actual_rut:
        return JsonResponse({"status": "false", "message": "No has iniciado sesión."})
    
    #OBTENEMOS LA SOLICITUD A ELIMINAR
    solicitud_a_cancelar = database.child("Solicitudes").child(id_solicitud).get().val() or {}

    #VALIDAMOS QUE LA SOLICITUD EXISTA
    if solicitud_a_cancelar == {}:
        return JsonResponse({"status": "false", "message": "No se pudo encontrar la solicitud."})

    #VALIDAMOS QUE LA SOLICITUD PERTENEZCA AL USUARIO
    rut_usuario_solicitud = solicitud_a_cancelar.get("id_rut")

    if usuario_actual_rut != rut_usuario_solicitud:
        return JsonResponse({"status": "false", "message": "Esa no es su solicitud."})
    
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
            blob = bucket.blob(f"{usuario_actual_rut}/Solicitudes/{id_solicitud}/{nombre_archivo}")

            blob.delete()
        except Exception as e:
            return JsonResponse({"status": "false", "message": f"Error al eliminar el archivo: {e}"})

    #AHORA SE ELIMINA DE FIREBASE
    db.reference('/Solicitudes/'+id_solicitud).delete()
    
    return JsonResponse({"status": "success", "message": "Solicitud cancelada (eliminada)."})

def obtener_solicitudes_administrar(request):
    #OBTENER USUARIO ACTUAL
    usuario_actual_rut = request.session.get("usuario_id")

    # OBTENER LOS USUARIOS DE LA BASE DE DATOS
    solicitudes = database.child("Solicitudes").get().val() or {}

    solicitudes_lista = []
    for id_solicitud, solicitud in solicitudes.items():
        fecha_inicio = solicitud.get("Fecha_inicio")
        fecha_fin = solicitud.get("Fecha_fin")
        id_aprobador = solicitud.get("id_aprobador")

        # FILTRO SEGÚN LA CONDICIÓN
        if fecha_inicio == "null" or (fecha_fin == "null" and id_aprobador == usuario_actual_rut):

            # FORMATEAR FECHA DE SOLICITUD
            fecha_solicitud_str = solicitud.get("Fecha_solicitud")
            created_date = "Sin fecha"
            sort_date = None
            if fecha_solicitud_str:
                try:
                    fecha_solicitud = datetime.fromisoformat(fecha_solicitud_str)
                    created_date = fecha_solicitud.strftime("%d %B, %Y")
                    sort_date = fecha_solicitud.date().isoformat()
                except ValueError:
                    created_date = fecha_solicitud_str

            # OBTENER NOMBRE DEL TIPO SOLICITUD
            tipo_solicitud_id = solicitud.get("tipo_solicitud")
            tipo_solicitud_nombre = database.child("TiposSolicitud").child(tipo_solicitud_id).get().val() or {}
            tipo_solicitud_nombre = tipo_solicitud_nombre.get("nombre")

            # DETERMINAR ESTADO ASIGNACIÓN
            estado_asignacion = "pendiente"
            if fecha_inicio != "null":
                estado_asignacion = "asignada"
            if fecha_fin != "null":
                estado_asignacion = "cerrada"

            solicitudes_lista.append({
                "id_solicitud": id_solicitud,
                "asunto": solicitud.get("Asunto"),
                "id_rut": solicitud.get("id_rut"),
                "descripcion": solicitud.get("Descripcion"),
                "estado": solicitud.get("Estado"),
                "fecha_fin": fecha_fin,
                "fecha_inicio": fecha_inicio,
                "fecha_solicitud": solicitud.get("Fecha_solicitud"),
                "id_aprobador": id_aprobador,
                "tipo_solicitud": solicitud.get("tipo_solicitud"),
                "sortDate": sort_date or created_date,
                "archivo": solicitud.get("archivo"),
                "archivo_name": solicitud.get("archivo_name"),
                "tipo_solicitud_nombre": tipo_solicitud_nombre,
                "estado_asignacion": estado_asignacion
            })

    return JsonResponse({'mensaje': 'Solicitudes listadas.', 'solicitudes': solicitudes_lista})
 
    


#FUNCIONES DE AYUDA
def formatear_rut(rut_limpio):
    """
    Recibe un RUT sin puntos ni guion, devuelve el RUT formateado: 12.345.678-9
    """
    if not rut_limpio:
        return ""
    rut_sin_dv = rut_limpio[:-1]
    dv = rut_limpio[-1]

    # Agregar puntos cada 3 dígitos desde el final
    rut_con_puntos = ""
    while len(rut_sin_dv) > 3:
        rut_con_puntos = "." + rut_sin_dv[-3:] + rut_con_puntos
        rut_sin_dv = rut_sin_dv[:-3]
    rut_con_puntos = rut_sin_dv + rut_con_puntos

    return f"{rut_con_puntos}-{dv}"

def correo_ya_existe(email):
    try:
        auth.get_user_by_email(email)
        return True 
    except auth.UserNotFoundError:
        return False

#EJEMPLOS

def ejemplo_crear(request):
    ref = database.child('/Usuario/'+ "RUT")
    ref.set({
        "ApellidoPaterno": "Nuñez",
        "Nombre": "Javier",
        "Telefono": "912345678",
        "Direccion": "asdasda",
        "Rol": "Dos",
        "Cargo": "Uno",
        "Fecha_creacion": datetime.now().isoformat()
    })

    return redirect("inicio_documentos")

def ejemplo_modificar(request):

    rut = "RUT"
    ref = database.child('/Usuario/'+ rut)
    ref.update({
        "ApellidoPaterno": "Nuñez_nuevo",
        "Nombre": "Javier_nuevo",
        "Telefono": "912345678",
        "Direccion": "asdasda_nuevo",
        "Fecha_creacion": datetime.now().isoformat()
    })

    return redirect("inicio_documentos")

def ejemplo_eliminar(request):
    #NO funciona por permisos
    rut = "RUT"
    ref = db.reference('/Usuario/'+ rut)
    ref.delete()

    return redirect("inicio_documentos")



