import re
from django.shortcuts import render, redirect
from django.views.decorators.http import require_POST,require_GET
from requests.exceptions import HTTPError
from datetime import datetime
from django.http import JsonResponse

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

        # VERIFICAR E ID DEL TOKEN CON FIREBASE_ADMIN
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token['uid']

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
            "id": id_usu,
            "name": nombre_completo,
            "email": usuario.get("correo", ""),
            "position": cargo_nombre,
            "createdDate": created_date,
            "sortDate": sort_date or fecha_creacion_str
        })

    return JsonResponse({'mensaje': 'Usuarios listados.', 'usuarios': usuarios_lista})










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


