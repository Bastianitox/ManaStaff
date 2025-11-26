from django.shortcuts import render
from functools import wraps
from django.http import JsonResponse
from staffweb.firebase import auth, db

#DECORADOR PARA VALIDAR QUE SEA ADMIN
def admin_required(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        rol_usuario = request.session.get("rol_usu")  # Ajusta al nombre real del campo de sesión
        if rol_usuario != "Uno":
            return render(request, "staffweb/403.html", status=403)
        return view_func(request, *args, **kwargs)
    return _wrapped_view

def firebase_auth_required(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        # 1. Leer header de autorización
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return JsonResponse({"error": "Token faltante"}, status=401) # 401 Unauthorized

        # 2. Limpiar token (Bearer)
        id_token = auth_header.split("Bearer ")[1] if auth_header.startswith("Bearer ") else auth_header

        # 3. Verificar token Firebase
        try:
            decoded = auth.verify_id_token(id_token)
            uid = decoded.get("uid")
        except Exception:
            # Token expirado, inválido, etc.
            return JsonResponse({"error": "Token de autenticación inválido o expirado."}, status=401) 
        
        # 4. Obtener el Rut de usuario autenticado
        try:
            # Reemplazamos la lógica del 'rut_usuario_actual' en el request
            rut_usuario_actual = db.reference(f"UidToRut/{uid}").get()
            if not rut_usuario_actual:
                return JsonResponse({"error": "No se encontró el RUT asociado a este usuario"}, status=404) # 404 Not Found
        except Exception:
            return JsonResponse({"error": "Error al acceder a la base de datos de usuarios."}, status=500)
        
        # 5. Éxito: Inyectar el RUT en el objeto request para que la vista lo use
        request.rut_usuario_actual = rut_usuario_actual

        # 6. Ejecutar la vista original
        return view_func(request, *args, **kwargs)

    return wrapper