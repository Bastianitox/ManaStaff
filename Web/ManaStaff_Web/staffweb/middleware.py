from django.shortcuts import redirect
from django.urls import reverse
from datetime import datetime
from django.conf import settings

class FirebaseAuthMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path

        # Rutas públicas que no requieren sesión
        rutas_publicas = [
            reverse("index"),
            reverse("iniciarSesion"),
            reverse("recuperar_contrasena_funcion"),
            reverse("recuperar_contrasena")
        ]

        # Si el usuario tiene sesión iniciada, comprobar inactividad
        if request.session.get("logeado"):
            ahora = datetime.now()
            ultima_actividad = request.session.get("ultima_actividad")

            if ultima_actividad:
                try:
                    ultima_actividad_dt = datetime.fromisoformat(ultima_actividad)
                    tiempo_inactivo = (ahora - ultima_actividad_dt).total_seconds()
                    if tiempo_inactivo > settings.SESSION_COOKIE_AGE:
                        # Sesión expirada por inactividad
                        request.session.flush()
                        request.session['mensaje_expiracion'] = "Tu sesión ha expirado por inactividad."
                        return redirect("index")
                except Exception as e:
                    # fallback si el formato falla
                    request.session.flush()
                    return redirect("index")

            # Actualizar timestamp de última actividad
            request.session["ultima_actividad"] = ahora.isoformat()

        # Bloquear acceso a rutas protegidas si no está logueado
        if not request.session.get("logeado") and path not in rutas_publicas:
            return redirect("index")

        # Continuar con la vista
        response = self.get_response(request)
        return response
