import re
from django.shortcuts import render, redirect
from django.views.decorators.http import require_POST,require_GET
from requests.exceptions import HTTPError
from datetime import datetime, timedelta
from django.http import JsonResponse, HttpResponse
import json
import re
import base64
from urllib.parse import unquote_plus
import requests
import mimetypes
from .firebase import authP, auth, database, storage, db
from .decorators import admin_required
import locale
from django.core.mail import send_mail

MAX_INTENTOS = 5
TIEMPO_BLOQUEO = timedelta(minutes=10)

#INICIO DE SESION
@require_POST
def iniciarSesion(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"status": "false", "message": "JSON inválido."})

    # Obtener campos desde JSON
    email = data.get("email")
    password = data.get("password")

    
    # VALIDAR CAMPOS VACIOS
    if not all([email, password]):
        return JsonResponse({"status": "false", "message": "Los campos correo y/o contraseña están vacíos."})

    # Validación de correo
    patron_email = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    if not re.match(patron_email, email):
        return JsonResponse({"status": "false", "message": "Correo o contraseña incorrectos."})
    email = str(email).lower()
    if not correo_ya_existe(email):
        return JsonResponse({"status": "false", "message": "Correo o contraseña incorrectos."})

    #CERRAR SESION
    request.session.flush()

    # VERIFICAR QUE EL CORREO EXISTA EN REALTIME DATABASE
    usuario = database.child("Usuario").order_by_child("correo").equal_to(email).get().val() or {}

    usuarioDATABASE = database.child("Usuario").order_by_child("correo").equal_to(email).get().val() or {}
    if not usuarioDATABASE:
        return JsonResponse({"status": "false", "message": "Correo o contraseña incorrectos."})

    #VALIDAR VERIFICACION DE CORREO
    try:
        user = auth.get_user_by_email(email)
        if not user.email_verified:
            return JsonResponse({"status": "false","message": "Tu correo aún no ha sido verificado. Revisa tu bandeja de entrada."})
    except auth.UserNotFoundError:
        return JsonResponse({"status": "false","message": "Correo no encontrado."})


    # VARIABLES DE HORA PARA BLOQUEO
    id_usu, usuario = next(iter(usuario.items()))

    try:
        locale.setlocale(locale.LC_TIME, "es_ES.utf8")  # Linux/Mac
    except:
        try:
            locale.setlocale(locale.LC_TIME, "Spanish_Spain.1252")  # Windows
        except:
            pass

    # VALIDAR SI EL USUARIO ESTA BLOQUEADO
    bloqueado_hasta = usuario.get("bloqueado_hasta")
    if bloqueado_hasta:
        bloqueado_dt = datetime.fromisoformat(bloqueado_hasta)
        if bloqueado_dt > datetime.now():
            fecha_formateada = bloqueado_dt.strftime("%d de %B del %Y a las %H:%Mhrs")
            return JsonResponse({"status": "false", "message": f"Cuenta bloqueada hasta el {fecha_formateada}. Demasiados intentos fallidos de inicio de sesión."})
        else:
            # Reiniciar bloqueo si ya pasó el tiempo
            database.child("Usuario").child(id_usu).update({"intentos_fallidos": 0, "bloqueado_hasta": None})

    # INICIAR SESION USANDO PYREBASE
    try:
        user = authP.sign_in_with_email_and_password(email, password)

        # REINICIAR INTENTOS DE BLOQUEO
        database.child("Usuario").child(id_usu).update({"intentos_fallidos": 0, "bloqueado_hasta": None})


        id_token = user['idToken']
        refresh_token = user['refreshToken']

        # GUARDAR TOKENS EN LA SESION
        request.session['firebase_id_token'] = id_token
        request.session['firebase_refresh_token'] = refresh_token

        uid = user['localId']
        request.session['usuario_id'] = uid


    except HTTPError as e:
        #VALIDAR QUE EL USUARIO Y CONTRASEÑA SEAN CORRECTOS
        try:
            error_json = json.loads(e.args[1])
            error_message = error_json['error']['message']
        except Exception:
            # fallback si no se puede parsear
            error_message = str(e)

        if error_message in ["INVALID_PASSWORD", "INVALID_LOGIN_CREDENTIALS"]:
            intentos = usuario.get("intentos_fallidos", 0) + 1
            data_actualizar = {"intentos_fallidos": intentos}
            if intentos >= MAX_INTENTOS:
                # Bloquear cuenta
                data_actualizar["bloqueado_hasta"] = (datetime.now() + TIEMPO_BLOQUEO).isoformat()
            database.child("Usuario").child(id_usu).update(data_actualizar)

            if intentos >= MAX_INTENTOS:
                mensaje = f"Cuenta bloqueada tras {MAX_INTENTOS} intentos fallidos."
            else:
                mensaje = f"Correo o contraseña incorrectos. Intentos restantes: {MAX_INTENTOS - intentos}"
      
        elif error_message == "EMAIL_NOT_FOUND":
            mensaje = "Correo o contraseña incorreectos."
        elif error_message == "TOO_MANY_ATTEMPTS_TRY_LATER":
            mensaje = "Demasiados intentos de inicio de sesión, intente más tarde."
        else:
            mensaje = "Error de autenticación: " + error_message

        return JsonResponse({"status": "false", "message": mensaje})

    except Exception:
        return JsonResponse({"status": "false", "message": "Error de autenticación con Firebase."})

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
        request.session['rol_usu'] = usuario.get('rol', '')

        return JsonResponse({"status": "success", "message": "Inicio de sesión correcto."})

@require_GET
def cerrarSesion(request):
    request.session.flush()
    return redirect("index")

@require_POST
def recuperar_contrasena_funcion(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"status": "false", "message": "JSON inválido."})
        
    correo = data.get("correo")
    if not correo:
        return JsonResponse({'status': 'false', 'mensaje':"El correo no debe estar vacío."})

    usuario = database.child("Usuario").order_by_child("correo").equal_to(correo).get().val()
    if not usuario:
        return JsonResponse({'status': 'false', 'mensaje':"Ese correo no está registrado en el sistema."})

    try:
        patron_correo = r'^[\w\.-]+@[\w\.-]+\.\w+$'
        if not re.match(patron_correo, correo):
            return JsonResponse({'status': 'false', 'mensaje':"El correo tiene un formato inválido."})
        authP.send_password_reset_email(correo)
        return JsonResponse({'status': 'success', 'mensaje':"Link de restablecimiento enviado a esa dirección."})
    except Exception as e:
        return JsonResponse({'status': 'false', 'mensaje':"Error al enviar el correo: "+str(e)})

#USUARIOS
@admin_required
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

@admin_required
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

@admin_required
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
@admin_required
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

    # VALIDAR LONGITUD DE CAMPOS
    campos_max = {
        "nombre": (2, 25),
        "segundo_nombre": (2, 25),
        "apellido_paterno": (2, 50),
        "apellido_materno": (2, 50),
        "direccion": (5, 150),
        "email": (5, 100),
    }

    for campo, (min_len, max_len) in campos_max.items():
        valor = data.get(campo, "").strip()
        if len(valor) < min_len:
            return JsonResponse({"status": "false", "message": f"El campo '{campo}' debe tener al menos {min_len} caracteres."})
        if len(valor) > max_len:
            return JsonResponse({"status": "false", "message": f"El campo '{campo}' no puede superar {max_len} caracteres."})


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
        verification_link = auth.generate_email_verification_link(email)

        send_mail(
            subject="Verifica tu cuenta",
            message=f"Por favor verifica tu cuenta haciendo clic en el siguiente enlace:\n\n{verification_link}",
            from_email="no-reply@tuempresa.com",
            recipient_list=[email],
            fail_silently=False,
        )

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
        "intentos_fallidos": 0,
        "bloqueado_hasta": None,
    })

    return JsonResponse({"status": "success", "message": "Usuario creado con éxito."})

@require_POST
@admin_required
def eliminar_usuario(request, rut):
    try:
        usuario = database.child(f"Usuario/{rut}").get().val()
        correo = usuario["correo"]
        
        usuario_id_en_sesion = request.session.get("usuario_id")
        
        if usuario_id_en_sesion == rut:
            return JsonResponse({"status": "false", "message": "No puede eliminar su propio usuario."})
        uid = auth.get_user_by_email(correo).uid

        auth.delete_user(uid)

        database.child(f"Usuario/{rut}").remove()

        eliminar_archivos_usuario(rut)

        solicitudes = database.child("Solicitudes").order_by_child("id_rut").equal_to(rut).get()
        if solicitudes.each():
            for solicitud in solicitudes.each():
                database.child("Solicitudes").child(solicitud.key()).remove()

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
@admin_required
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

    usuario_id_en_sesion = request.session.get("usuario_id")
    
    if usuario_id_en_sesion == rut:
        return JsonResponse({"status": "false", "message": "No puede modificar su propio usuario."})
    #VALIDACIONES

    # VALIDAR CAMPOS VACIOS
    if not all([nombre, segundo_nombre,apellido_paterno, apellido_materno,celular, direccion, cargo, rol, email]):
        return JsonResponse({"status": "false", "message": "Los campos obligatorios no pueden estar vacíos."})
    
    # VALIDAR LONGITUD DE CAMPOS
    campos_max = {
        "nombre": (2, 25),
        "segundo_nombre": (2, 25),
        "apellido_paterno": (2, 50),
        "apellido_materno": (2, 50),
        "direccion": (5, 150),
        "email": (5, 100)
    }

    valores_campo = {
        "nombre": nombre,
        "segundo_nombre": segundo_nombre,
        "apellido_paterno": apellido_paterno,
        "apellido_materno": apellido_materno,
        "direccion": direccion,
        "email": email
    }

    for campo, (min_len, max_len) in campos_max.items():
        valor = valores_campo[campo]
        if len(valor) < min_len:
            return JsonResponse({"status": "false", "message": f"El campo '{campo}' debe tener al menos {min_len} caracteres."})
        if len(valor) > max_len:
            return JsonResponse({"status": "false", "message": f"El campo '{campo}' no puede superar {max_len} caracteres."})


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
        blob.delete()


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

@admin_required
def obtener_solicitudes_administrar(request):
    #OBTENER USUARIO ACTUAL
    usuario_actual_rut = request.session.get("usuario_id")

    # OBTENER LAS SOLICITUDES DE LA BASE DE DATOS
    solicitudes = database.child("Solicitudes").get().val() or {}

    solicitudes_lista = []
    for id_solicitud, solicitud in solicitudes.items():
        fecha_inicio = solicitud.get("Fecha_inicio")
        fecha_fin = solicitud.get("Fecha_fin")
        id_aprobador = solicitud.get("id_aprobador")

        # FILTRO SEGÚN LA CONDICIÓN
        if fecha_inicio == "null" or fecha_fin == "null" or (fecha_fin != "null" and id_aprobador == usuario_actual_rut):

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

            # OBTENER NOMBRE DEL CREADOR DE SOLICITUD
            rut_usuario_solicitud = solicitud.get("id_rut")
            rut_usuario_solicitud_nombre = database.child("Usuario").child(rut_usuario_solicitud).get().val() or {}
            rut_usuario_solicitud_nombre = rut_usuario_solicitud_nombre.get("Nombre") + " " + rut_usuario_solicitud_nombre.get("ApellidoPaterno")

            # OBTENER NOMBRE DEL APROBADOR DE SOLICITUD
            rut_usuario_aprobador = solicitud.get("id_aprobador")
            rut_usuario_aprobador_nombre = None
            if rut_usuario_aprobador != "null":
                rut_usuario_aprobador_nombre = database.child("Usuario").child(rut_usuario_aprobador).get().val() or {}
                rut_usuario_aprobador_nombre = rut_usuario_aprobador_nombre.get("Nombre") + " " + rut_usuario_aprobador_nombre.get("ApellidoPaterno")

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
                "estado_asignacion": estado_asignacion,
                "rut_usuario_solicitud_nombre": rut_usuario_solicitud_nombre,
                "rut_usuario_aprobador_nombre": rut_usuario_aprobador_nombre
            })

    return JsonResponse({'mensaje': 'Solicitudes listadas.', 'solicitudes': solicitudes_lista})

@admin_required
def asignarme_solicitud(request, id_solicitud):
    #OBTENER EL USUARIO ACTUAL
    usuario_actual_rut = request.session.get("usuario_id")

    #VALIDAR USUARIO ACTUAL
    if not usuario_actual_rut:
        return JsonResponse({'status': 'false', 'mensaje': 'No ha iniciado sesión.'})

    #VALIDAR QUE USUARIO SEA ADMIN (RECURSOS HUMANOS)
    usuario_actual = database.child("Usuario").child(usuario_actual_rut).get().val() or {}
    usuario_actual_rol = usuario_actual.get("rol")

    if not usuario_actual_rol:
        return JsonResponse({'status': 'false', 'mensaje': 'Ocurrio un error al obtener su rol.'})

    if usuario_actual_rol != "Uno":
        return JsonResponse({'status': 'false', 'mensaje': 'Usted no es de Recursos Humanos.'})
    

    #OBTENER LA FECHA DE INICIO DE SOLICITU PARA VALIDAR ASIGNACION
    solicitud = database.child("Solicitudes").child(id_solicitud).get().val() or {}
    if solicitud == {}:
        return JsonResponse({'status': 'false', 'mensaje': 'La solicitud no pudo ser encontrada.'})
    solicitud_fecha_inicio =solicitud.get("Fecha_inicio")

    solicitud_id_rut = solicitud.get("id_rut")
    #VALIDAR QUE LA SOLICITUD NO SEA PROPIA
    if solicitud_id_rut == usuario_actual_rut:
        return JsonResponse({'status': 'false', 'mensaje': 'No puede asignarse su propia solicitud.'})

    #OBTENER LA REF DE SOLICITUD A ASIGNAR
    ref = database.child('Solicitudes/'+ id_solicitud)
    #VALIDAR QUE LA SOLICITUD NO ESTE YA ASIGNADA
    if solicitud_fecha_inicio != "null":
        return JsonResponse({'status': 'false', 'mensaje': 'Solicitud ya asignada.'})

    ref.update({
        "Fecha_inicio": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        "id_aprobador": usuario_actual_rut
    })

    return JsonResponse({'status': 'success', 'mensaje': 'Solicitud asignada.'})

@admin_required
def cerrar_solicitud(request, id_solicitud, estado):
    #OBTENER EL USUARIO ACTUAL
    usuario_actual_rut = request.session.get("usuario_id")

    #VALIDAR USUARIO ACTUAL
    if not usuario_actual_rut:
        return JsonResponse({'status': 'false', 'mensaje': 'No ha iniciado sesión.'})

    #VALIDAR QUE USUARIO SEA ADMIN (RECURSOS HUMANOS)
    usuario_actual = database.child("Usuario").child(usuario_actual_rut).get().val() or {}
    usuario_actual_rol = usuario_actual.get("rol")

    if not usuario_actual_rol:
        return JsonResponse({'status': 'false', 'mensaje': 'Ocurrio un error al obtener su rol.'})

    if usuario_actual_rol != "Uno":
        return JsonResponse({'status': 'false', 'mensaje': 'Usted no es de Recursos Humanos.'})
    

    #OBTENER LA FECHA DE INICIO DE SOLICITU PARA VALIDAR ASIGNACION
    solicitud = database.child("Solicitudes").child(id_solicitud).get().val() or {}
    solicitud_fecha_fin =solicitud.get("Fecha_fin")

    solicitud_id_rut = solicitud.get("id_rut")
    #VALIDAR QUE LA SOLICITUD NO SEA PROPIA
    if solicitud_id_rut == usuario_actual_rut:
        return JsonResponse({'status': 'false', 'mensaje': 'No puede cerrar su propia solicitud.'})
    
    #VALIDAR ESTADO
    if estado != "aprobada" and estado != "rechazada":
        return JsonResponse({'status': 'false', 'mensaje': 'Solo puede aprobar o rechazar la solicitud.'})

    #OBTENER LA REF DE SOLICITUD A ASIGNAR
    ref = database.child('Solicitudes/'+ id_solicitud)
    #VALIDAR QUE LA SOLICITUD NO ESTE YA ASIGNADA
    if solicitud_fecha_fin != "null":
        return JsonResponse({'status': 'false', 'mensaje': 'Solicitud ya cerrada.'})

    ref.update({
        "Fecha_fin": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        "Estado": str(estado)
    })

    return JsonResponse({'status': 'success', 'mensaje': 'Solicitud cerrada.'})

#DOCUMENTOS
def descargar_documento(request, doc_id):
    documentos_ref = db.reference("Documentos").get() or {}
    doc_data = documentos_ref.get(doc_id)
    
    if not doc_data:
        return HttpResponse("Documento no encontrado", status=404)

    url = doc_data.get("url")  # URL completa con token
    nombre_archivo = url.split("/")[-1]
    nombre_archivo = str(nombre_archivo.split("?")[0])
    nombre_archivo = unquote_plus(nombre_archivo)

    prefix = doc_id + "/"
    ultimo_segmento = nombre_archivo.split(prefix, 1)[-1]
    # Intentar obtener el tipo MIME según extensión
    tipo_mime, _ = mimetypes.guess_type(nombre_archivo)
    if not tipo_mime:
        tipo_mime = 'application/octet-stream'  # fallback

    # Descargar archivo desde Firebase Storage
    response = requests.get(url, stream=True)
    if response.status_code != 200:
        return HttpResponse("No se pudo descargar el documento", status=500)

    # Devolver como descarga
    resp = HttpResponse(response.content, content_type=tipo_mime)
    resp['Content-Disposition'] = f'attachment; filename="{ultimo_segmento}"'
    return resp

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

def verificar_correo(email):
    try:
        user = auth.get_user_by_email(email)
        return user.email_verified
    except auth.UserNotFoundError:
        return False