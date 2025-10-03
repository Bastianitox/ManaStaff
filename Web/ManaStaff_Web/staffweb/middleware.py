from django.shortcuts import redirect
from django.urls import reverse

class FirebaseAuthMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path
        # Excluir rutas públicas
        rutas_publicas = [
            reverse("index"),
            reverse("iniciarSesion"),
            reverse("recuperar_contrasena_funcion"),
            reverse("recuperar_contrasena")
        ]
        if not request.session.get("logeado") and path not in rutas_publicas:
            return redirect("index")
        return self.get_response(request)
