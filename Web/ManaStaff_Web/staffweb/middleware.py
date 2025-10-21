from django.shortcuts import redirect
from django.urls import reverse
from datetime import datetime
from django.conf import settings
from django.utils.deprecation import MiddlewareMixin
import json
import uuid

class FirebaseAuthAuditoriaMiddleware(MiddlewareMixin):
    ACCIONES = {
        "/": "Inicio de sesión",
        "/cerrarSesion": "logout",
        "/recuperar_contrasena": "Recuperar Clave",
        "/inicio_solicitudes": "Inicio solicitudes",
        "/inicio_documentos": "Inicio solicitudes",
        "/inicio_perfil": "Inicio solicitudes",
        "/inicio_noticias_eventos": "Inicio solicitudes",
        "/inicio_dashboard": "Inicio solicitudes",
        "/crear_solicitud": "Inicio solicitudes",
        "/ver_documentos": "Inicio solicitudes",
        "/cambiar_contrasena": "Inicio solicitudes",
        "/cambiar_pin": "Inicio solicitudes",
        "/crear_documento": "Inicio solicitudes",
        "/modificar_documento": "Inicio solicitudes",
        "/recuperar_pin": "Inicio solicitudes",
        "/panel_administrar": "Inicio solicitudes",
        "/administrar_documentos": "Inicio solicitudes",
        "/administrar_solicitudes": "Inicio solicitudes",
        "/administrar_usuarios": "Inicio solicitudes",
        "/crear_usuario": "Inicio solicitudes",
        "/modificar_usuario": "Inicio solicitudes",
        "/administrar_logs": "Inicio solicitudes",
        "/administrar_noticiasyeventos": "Inicio solicitudes",
        "/documentos_usuarios": "Inicio solicitudes",
        "/editar_noticiasyeventos": "Inicio solicitudes",
        "/crear_publicacion": "Inicio solicitudes",
        "/eliminar_documento": "Inicio solicitudes"
    }

    def process_request(self, request):
        path = request.path

        rutas_publicas = [
            reverse("index"),
            reverse("iniciarSesion"),
            reverse("recuperar_contrasena_funcion"),
            reverse("recuperar_contrasena")
        ]

        # Obtener el estado de login
        esta_logeado = request.session.get("logeado")
        
        # Verificar si tenemos cookie de última actividad (persiste aunque Django limpie la sesión)
        ultima_actividad_cookie = request.COOKIES.get("ultima_actividad")

        if esta_logeado:
            ahora = datetime.now()

            if ultima_actividad_cookie:
                try:
                    ultima_actividad_dt = datetime.fromisoformat(ultima_actividad_cookie)
                    tiempo_inactivo = (ahora - ultima_actividad_dt).total_seconds()
                    
                    if tiempo_inactivo > settings.SESSION_COOKIE_AGE:
                        # Sesión expirada por inactividad
                        request.session.flush()
                        request.session['mensaje_expiracion'] = "Tu sesión ha expirado por inactividad."
                        
                        # Necesitamos crear una respuesta para eliminar la cookie
                        response = redirect("index")
                        response.delete_cookie("ultima_actividad")
                        return response
                        
                except Exception as e:
                    request.session.flush()
                    request.session['mensaje_expiracion'] = "Tu sesión ha expirado por inactividad."
                    
                    response = redirect("index")
                    response.delete_cookie("ultima_actividad")
                    return response

            # Actualizar última actividad en la sesión (para referencia)
            request.session["ultima_actividad"] = ahora.isoformat()
            # Marcar que necesitamos actualizar la cookie en process_response
            request._actualizar_cookie_actividad = ahora.isoformat()
        
        # Verificar si había una cookie de actividad pero no hay sesión logeada (Django expiró la sesión)
        elif ultima_actividad_cookie and path not in rutas_publicas:
            request.session['mensaje_expiracion'] = "Tu sesión ha expirado por inactividad."
            
            response = redirect("index")
            response.delete_cookie("ultima_actividad")
            return response

        # Si no está logeado y no es ruta pública
        if not esta_logeado and path not in rutas_publicas:
            return redirect("index")

    def process_response(self, request, response):
        # Actualizar cookie de última actividad si el usuario está logeado
        if hasattr(request, '_actualizar_cookie_actividad'):
            response.set_cookie(
                "ultima_actividad",
                request._actualizar_cookie_actividad,
                max_age=settings.SESSION_COOKIE_AGE * 200,  # Cookie dura el doble para detectar expiración
                httponly=True,
                samesite='Lax'
            )
        
        # Auditoría automática
        path = request.path
        accion = None
        for url_prefix in self.ACCIONES.keys():
            if path == url_prefix:
                accion = "Página visitada"
                break

        if accion:
            detalle = f"Página visitada: {path}"
            self.registrar_auditoria(request, response, accion, detalle)

        return response

    def registrar_auditoria(self, request, response, accion, detalle):
        from staffweb.firebase import database

        usuario_rut = request.session.get("usuario_rut", "anonimo")
        ip_origen = request.META.get("REMOTE_ADDR", "")
        navegador = request.META.get("HTTP_USER_AGENT", "")
        ahora = datetime.now().isoformat()
        resultado = "exito"

        if accion == "login" and hasattr(response, 'status_code') and response.status_code == 200:
            try:
                content_str = response.content.decode('utf-8')
                data = json.loads(content_str)
                if data.get("status") != "success":
                    resultado = "fallido"
                    detalle = data.get("message", "Intento de login fallido")
            except Exception as e:
                resultado = "fallido"
                detalle = f"Error parseando respuesta de login: {str(e)}"

        log_data = {
            "id_auditoria": str(uuid.uuid4()),
            "id_rut": usuario_rut,
            "accion": "Uno",
            "descripcion": detalle,
            "fecha_hora": ahora,
            "ip_origen": ip_origen,
            "navegador": navegador,
            "resultado": resultado
        }

        try:
            database.child("Auditoria").push(log_data)
        except Exception as e:
            print("Error registrando log:", e)