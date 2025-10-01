from datetime import datetime
import re

from django.shortcuts import render

import os
from django.conf import settings
from django.shortcuts import render

#IMPORTS DE FIREBASE
from firebase_admin import auth
from .firebase import firebase, db, storage


# VARIABLES FIREBASE
database = firebase.database()
authP = firebase.auth()


def index(request):
    return render(request, 'staffweb/index.html')

def recuperar_contrasena(request):
    return render(request, 'staffweb/recuperar_contrasena.html')

def inicio_solicitudes(request):
    return render(request, 'staffweb/inicio_solicitudes.html')

def inicio_documentos(request):
    """Data proveniente de Firebase."""
    # Obtiene datos del usuario autenticado para filtrar los registros que podrá ver
    usuario_id = request.session.get('usuario_id')
    user_role = (request.session.get('rol_usu') or '').strip().lower()

    # Normaliza cualquier RUT/id eliminando separadores para comparar con Firebase
    def normalize_rut(value):
        return ''.join(ch for ch in str(value) if ch.isdigit())

    # Intenta convertir la fecha almacenada en la BD en un objeto datetime utilizable
    def parse_date(value):
        if not value:
            return None
        value_str = str(value).strip()
        for fmt in ("%d-%m-%Y", "%Y-%m-%d", "%d/%m/%Y", "%d.%m.%Y"):
            try:
                return datetime.strptime(value_str, fmt)
            except ValueError:
                continue
        return None

    # Formatea la fecha a texto "DD Mes, YYYY" y devuelve un ISO para ordenamiento
    def format_date(value):
        months = [
            "Enero",
            "Febrero",
            "Marzo",
            "Abril",
            "Mayo",
            "Junio",
            "Julio",
            "Agosto",
            "Septiembre",
            "Octubre",
            "Noviembre",
            "Diciembre",
        ]
        parsed = parse_date(value)
        if parsed:
            return f"{parsed.day:02d} {months[parsed.month - 1]}, {parsed.year}", parsed.date().isoformat()
        return str(value), None

    # Calcula el tamaño en MB independiente de la unidad original registrada
    def parse_size(value):
        if value is None:
            return None, None
        raw = str(value).strip()
        if not raw:
            return None, None
        match = re.match(r"([\d.,]+)\s*([a-zA-Z]+)?", raw)
        if not match:
            return raw.upper().replace(' ', ''), None
        number = match.group(1).replace(',', '.')
        unit = (match.group(2) or 'MB').upper()
        try:
            size_value = float(number)
        except ValueError:
            return f"{number}{unit}", None
        if unit == 'KB':
            size_mb = size_value / 1024
        elif unit == 'GB':
            size_mb = size_value * 1024
        else:
            size_mb = size_value
            unit = 'MB'
        display = f"{size_value:g}{unit}"
        return display, size_mb

    documents = []
    # Referencia la colección Documentos en Realtime Database
    ref = db.reference('Documentos')
    normalized_user_rut = normalize_rut(usuario_id) if usuario_id else ''

    # Busca los documentos permitidos (solo los del usuario salvo rol administrador)
    try:
        raw_documents = {}
        is_admin = user_role in {'admin', 'administrador'}
        if normalized_user_rut and not is_admin:
            candidates = [normalized_user_rut]
            if normalized_user_rut.isdigit():
                candidates.append(int(normalized_user_rut))
            for candidate in candidates:
                raw_documents = ref.order_by_child('id_rut').equal_to(candidate).get() or {}
                if raw_documents:
                    break
            if not raw_documents:
                all_docs = ref.get() or {}
                raw_documents = {
                    key: value for key, value in all_docs.items()
                    if normalize_rut(value.get('id_rut')) == normalized_user_rut
                }
        else:
            raw_documents = ref.get() or {}
    except Exception:
        raw_documents = {}

    # Construye la estructura que usará el frontend para pintar cada tarjeta
    for doc_id, data in (raw_documents or {}).items():
        if not isinstance(data, dict):
            continue
        rut_in_doc = normalize_rut(data.get('id_rut'))
        if normalized_user_rut and rut_in_doc and rut_in_doc != normalized_user_rut and user_role not in {'admin', 'administrador'}:
            continue

        formatted_date, sort_date = format_date(data.get('Fecha_emitida') or data.get('fecha_emitida'))
        display_size, size_mb = parse_size(data.get('tamano_archivo') or data.get('tamano') or data.get('size'))

        documents.append({
            'id': doc_id,
            'title': data.get('nombre') or data.get('titulo') or 'Documento',
            'format': (data.get('tipo_documento') or data.get('formato') or 'PDF').upper(),
            'size': display_size or '0MB',
            'sizeInMb': size_mb,
            'date': formatted_date or '',
            'sortDate': sort_date,
            'available': bool(data.get('url')),
            'filePath': data.get('url'),
            'raw': data,
        })

    context = {
        'documents': documents,
    }

    return render(request, 'staffweb/inicio_documentos.html', context)
    

def inicio_perfil(request):
    return render(request, 'staffweb/inicio_perfil.html')
    

def inicio_noticias_eventos(request):
    return render(request, 'staffweb/inicio_noticias_eventos.html')
    

def inicio_dashboard(request):
    return render(request, 'staffweb/inicio_dashboard.html')
    

def crear_solicitud(request):
    return render(request, 'staffweb/crear_solicitud.html')

def ver_documentos(request):
    return render(request, "staffweb/ver_documentos.html")

def cambiar_contrasena(request):
    return render(request, "staffweb/cambiar_contrasena.html")

def cambiar_pin(request):
    return render(request, "staffweb/cambiar_pin.html")

#ADMINISTRACION
def panel_administrar(request):
    return render(request, "staffweb/panel_administrar.html")

def administrar_usuarios(request):
    return render(request, "staffweb/administrar_usuarios.html")

def crear_usuario(request):
    roles_lista = []
    cargos_lista = []
    #OBTENER ROLES
    roles = database.child("Rol").get().val() or {}
    for id_rol, rol in roles.items():
        roles_lista.append({
            "id_rol": id_rol,
            "nombre": rol.get("nombre")
        })
    #OBTENER CARGOS
    cargos = database.child("Cargo").get().val() or {}
    for id_cargo, cargo in cargos.items():
        cargos_lista.append({
            "id_cargo": id_cargo,
            "nombre": cargo.get("Nombre")
        })
    
    valores = {
        "roles": roles_lista,
        "cargos": cargos_lista
    }
    return render(request, "staffweb/crear_usuario.html", valores)

def modificar_usuario(request):
    return render(request, "staffweb/modificar_usuario.html")
    
def administrar_solicitudes(request):
    return render(request, "staffweb/administrar_solicitudes.html")
    
def administrar_documentos(request):
    return render(request, "staffweb/administrar_documentos.html")

def administrar_noticiasyeventos(request):
    return render(request, "staffweb/administrar_noticiasyeventos.html")

def administrar_logs(request):
    return render(request, "staffweb/administrar_logs.html")
