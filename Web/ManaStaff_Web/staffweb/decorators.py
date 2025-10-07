from django.shortcuts import render
from functools import wraps

#DECORADOR PARA VALIDAR QUE SEA ADMIN
def admin_required(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        rol_usuario = request.session.get("rol_usu")  # Ajusta al nombre real del campo de sesión
        if rol_usuario != "Uno":
            return render(request, "staffweb/403.html", status=403)
        return view_func(request, *args, **kwargs)
    return _wrapped_view