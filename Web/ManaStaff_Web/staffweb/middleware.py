from django.shortcuts import redirect
from django.urls import reverse
from datetime import datetime
from django.conf import settings
from django.utils.deprecation import MiddlewareMixin
import json
import uuid

class FirebaseAuthAuditoriaMiddleware(MiddlewareMixin):
    ACCIONES = {
        "/iniciarSesion": "login",
        "/cerrarSesion": "logout",
        "/recuperar_contrasena_funcion": "restablecer_contrasena",
        "/crear_solicitud_funcion": "crear_solicitud",
        "/cancelar_solicitud_funcion": "cancelar_solicitud",
        "/crear_usuario_funcion": "crear_usuario",
        "/modificar_usuario_funcion": "modificar_usuario",
        "/eliminar_usuario": "eliminar_usuario",
        "/crear_publicacion_funcion": "crear_publicacion",
        "/modificar_publicacion": "modificar_publicacion",
        "/eliminar_publicacion_funcion": "eliminar_publicacion",
        "/obtener_usuarios": "obtener_usuarios",
        "/obtener_usuario": "obtener_usuario",
        "/obtener_solicitudes_usuario": "obtener_solicitudes_usuario",
        "/obtener_solicitudes_administrar": "obtener_solicitudes_administrar",
        "/asignarme_solicitud": "asignarme_solicitud",
        "/cerrar_solicitud": "cerrar_solicitud",
        "/descargar_documento": "descargar_documento",
        "/crear_documento": "crear_documento",
        "/documentos_usuarios": "documentos_usuarios",
        "/administrar_logs": "administrar_logs",
        "/administrar_documentos": "administrar_documentos",
        "/administrar_solicitudes": "administrar_solicitudes",
        "/administrar_usuarios": "administrar_usuarios",
        "/administrar_noticiasyeventos": "administrar_noticiasyeventos",
        "/panel_administrar": "panel_administrar",
        "/crear_noticiasyeventos": "crear_noticiasyeventos",
        "/editar_publicacion": "editar_publicacion",
        "/eliminar_publicacion": "eliminar_publicacion",
        "/validar_pin": "validar_pin",
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
                max_age=settings.SESSION_COOKIE_AGE * 2,  # Cookie dura el doble para detectar expiración
                httponly=True,
                samesite='Lax'
            )
        
        # Auditoría automática
        path = request.path
        accion = None
        for url_prefix, act in self.ACCIONES.items():
            if path.startswith(url_prefix):
                accion = act
                break

        if accion:
            self.registrar_auditoria(request, response, accion)

        return response

    def registrar_auditoria(self, request, response, accion):
        from staffweb.firebase import database

        usuario_rut = request.session.get("usuario_rut", "anonimo")
        ip_origen = request.META.get("REMOTE_ADDR", "")
        navegador = request.META.get("HTTP_USER_AGENT", "")
        ahora = datetime.now().isoformat()
        resultado = "exito"
        detalle = f"Acción: {accion}"

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
            "accion": accion,
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