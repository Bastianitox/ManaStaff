import re
from django.shortcuts import render
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
#-----------------------------------------PIN--------------------------------------------------
from django.views.decorators.csrf import csrf_exempt

def validar_pin(request):
    #Valida el PIN 

    # tomar el PIN enviado 
    pin = (request.POST.get("pin") 
           or (request.body and __import__("json").loads(request.body.decode("utf-8")).get("pin"))
           or "").strip()

    if not pin or len(pin) != 4 or not pin.isdigit():
        return JsonResponse({"ok": False, "error": "PIN inválido."}, status=400)

    #obtener rut del usuario desde la sesión
    rut = (request.session.get("usuario_rut") or "").strip()
    if not rut:
        return JsonResponse({"ok": False, "error": "Sesión no válida."}, status=401)
    
    #normalizar solo dígitos
    rut = "".join(ch for ch in rut if ch.isdigit())

    try:
        #leer desde Realtime Database Usuario/<rut>/PIN
        usuario_data = database.child("Usuario").child(rut).get().val() or {}
        pin_real = str(usuario_data.get("PIN") or "").strip()
    except Exception as e:
        return JsonResponse({"ok": False, "error": "Error consultando la base de datos."}, status=500)

    # comparar
    if pin and pin_real and str(pin) == str(pin_real):
        # marcar sesión como "pin_verificado"
        request.session["pin_validado"] = True
        return JsonResponse({"ok": True})
    else:
        return JsonResponse({"ok": False, "error": "PIN incorrecto."}, status=403)

#----------------------------------------------------------------------------------------------

def funcion_dos(request):
    pass

# Listar todas las publicaciones
def listar_publicaciones():
    database.child()
    ref = db.reference("Anuncio")
    anuncios = ref.get() or {}
    return anuncios

# Crear nueva publicación
def crear_publicacion_funcion(data):

    database.child()
    ref = db.reference("Anuncio")
    ref.push(data)

# Obtener una publicación por ID
def obtener_publicacion(pub_id):
    database.child()
    ref = db.reference(f"Anuncio/{pub_id}")
    return ref.get()

# Modificar una publicación existente
def modificar_publicacion(pub_id, data):
    database.child()
    ref = db.reference(f"Anuncio/{pub_id}")
    ref.update(data)

# Eliminar una publicación
def eliminar_publicacion_funcion(pub_id):
    database.child()
    ref = db.reference(f"Anuncio/{pub_id}")
    ref.delete()