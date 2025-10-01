import re
from django.shortcuts import render, redirect
from django.views.decorators.http import require_POST,require_GET
from requests.exceptions import HTTPError
from datetime import datetime, timedelta
from django.http import JsonResponse
import re

from .firebase import authP, auth, database, storage, db


@require_POST
def iniciarSesion(request):
    request.session.flush()

    email = request.POST.get('email', None)
    password = request.POST.get('password', None)

    # VALIDAR CAMPOS VACIOS
    if not email or not password:
        return render(request, 'staffweb/index.html', {"mensaje": "Los campos correo y/o contraseña están vacíos."})

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

@require_POST
def crear_usuario_funcion(request):
    nombre = request.POST.get('nombre', None)
    segundo_nombre = request.POST.get('Segundo_nombre', None)
    apellido_paterno = request.POST.get('apellido_paterno', None)
    apellido_materno = request.POST.get('apellido_materno', None)
    rut = request.POST.get('rut', None)
    celular = request.POST.get('celular', None)
    direccion = request.POST.get('direccion', None)
    email = request.POST.get('email', None)
    cargo = request.POST.get('cargo', None)
    imagen = request.FILES.get('imagen', None)
    rol = request.POST.get('rol', None)
    pin = request.POST.get('pin', None)
    password = request.POST.get('password', None)

    # VALIDAR CAMPOS VACIOS
    if not all([nombre, segundo_nombre,apellido_paterno, apellido_materno, rut,celular, direccion,cargo,rol, imagen, pin, email, password]):
        return render(request, "staffweb/crear_usuario.html", {"mensaje": "Los campos no pueden estar vacíos."})

    # Validación de RUT (simple)
    import re
    patron_rut = r"^\d{1,2}\.?\d{3}\.?\d{3}-[\dkK]$"
    if not re.match(patron_rut, rut):
        return render(request, "staffweb/crear_usuario.html", {"mensaje": "El RUT ingresado no es válido."})
    
    # Validación de correo
    patron_email = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    if not re.match(patron_email, email):
        return render(request, "staffweb/crear_usuario.html", {"mensaje": "El correo electrónico no es válido."})
    
    # Validación de contraseña (mínimo 6 caracteres para Firebase)
    if len(password) < 6:
        return render(request, "staffweb/crear_usuario.html", {"mensaje": "La contraseña debe tener al menos 6 caracteres."})

    #VALIDAR TELEFENO EN FORMATO CHILENO (+56 9 1234 5678)
    if celular and not re.match(r'^\+56 9 \d{4} \d{4}$', celular):
        return render(request, "staffweb/crear_usuario.html", {"mensaje": "El número de celular debe tener el formato: +56 9 1234 5678"})

    
    #OBTENER EL RUT LIMPIO DEL USUARIO
    rut_limpio = rut.replace(".", "").replace("-", "")


    #CACHE CONTROL
    cache_control_header = "public, max-age=3600, s-maxage=86400"
    #VALIDACION DE IMAGEN
    if imagen:
        ext_permitidas = ["jpg", "jpeg", "png", "gif"]
        ext = imagen.name.split(".")[-1].lower()
        if ext not in ext_permitidas:
            return render(request, "staffweb/crear_usuario.html", {"mensaje": "Formato de imagen no permitido. Usa JPG, PNG o GIF."})

        # SUBIR IMAGEN A STORAGE
        bucket = storage.bucket()
        blob = bucket.blob(f"{rut_limpio}/Imagen/{imagen.name}")
        blob.upload_from_file(imagen, content_type=imagen.content_type)
        blob.cache_control = "public, max-age=3600, s-maxage=86400"
        blob.patch()

        urlImagen = blob.generate_signed_url(
            expiration=timedelta(weeks=150),
            method="GET"
        )
    else:
        urlImagen = "/static/default.png"

    # CREAR USUARIO EN AUTHENTICATION
    try:
        userFIREBASE = auth.create_user(email=email, password=password)
    except Exception as e:
        return render(request, "staffweb/crear_usuario.html", {"mensaje": f"Error al crear usuario en Firebase: {e}"})

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

    return redirect("administrar_usuarios")

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

        #Eliminar las solicitudes del usuario
        database.child(f"Solicitudes/{rut}").remove()

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



