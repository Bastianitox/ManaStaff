def user_info(request):
    return {
        "nombre_usu": request.session.get("nombre_usu", "Invitado"),
        "apellido_usu": request.session.get("apellido_usu", "Apellido"),
        "usuario_id": request.session.get("usuario_id", "0"),
        "correo_usu": request.session.get("correo_usu", "correo@ejemplo.com"),
        "logeado": request.session.get("logeado", "Invitado"),
        "rol_usu": request.session.get("rol_usu", "Cero"),
        "cargo_usu": request.session.get("cargo_usu", "Trabajo de usuario"),
        "url_imagen_usuario": request.session.get("url_imagen_usuario", "/static/staffweb/img/user.jpg"),
    }
