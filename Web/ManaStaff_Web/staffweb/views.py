from datetime import datetime, timedelta
import re
import json

from django.shortcuts import render

import os, re
from django.conf import settings
from django.shortcuts import render
from urllib.parse import urlparse, unquote



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
    """Muestra los documentos que le pertenecen al usuario autenticado"""
    user_role = (request.session.get('rol_usu') or '').strip().lower()

    def normalize_rut(value):
        return ''.join(ch for ch in str(value or '') if ch.isdigit())

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

    def format_date(value):
        months = [
            "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
        ]
        parsed = parse_date(value)
        if parsed:
            return f"{parsed.day:02d} {months[parsed.month - 1]}, {parsed.year}", parsed.date().isoformat()
        return str(value), None

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

    # rut del usuario en sesión
    normalized_user_rut = normalize_rut(request.session.get('usuario_rut')) or normalize_rut(request.session.get('usuario_id'))

    documents = []
    ref = db.reference('Documentos')

    try:
        raw_documents = ref.get() or {}
        if not isinstance(raw_documents, dict):
            raw_documents = {}
    except Exception:
        raw_documents = {}

    for doc_id, data in raw_documents.items():
        if not isinstance(data, dict):
            continue

        # Solo ver los suyos
        rut_in_doc = normalize_rut(data.get('id_rut') or data.get('Rut') or data.get('rut'))
        if normalized_user_rut and user_role not in {'admin', 'administrador'} and rut_in_doc != normalized_user_rut:
            continue

        formatted_date, sort_date = format_date(data.get('Fecha_emitida') or data.get('fecha_emitida'))
        display_size, size_mb = parse_size(data.get('tamano_archivo') or data.get('tamano') or data.get('size'))

        nombre = data.get('nombre') or data.get('titulo') or 'Documento'
        raw_url = data.get('url')  # volvemos a usar la URL guardada

        documents.append({
            'id': doc_id,
            'title': nombre,
            'format': (data.get('tipo_documento') or data.get('formato') or 'PDF').upper(),
            'size': display_size or '0MB',
            'sizeInMb': size_mb,
            'date': formatted_date or '',
            'sortDate': sort_date,
            'available': bool(raw_url),
            'filePath': raw_url,          # se usará para VER
            'downloadPath': raw_url,      # se usará para DESCARGAR
            'raw': data,
        })

    context = {'documents': documents}
    return render(request, "staffweb/inicio_documentos.html", context)


def inicio_perfil(request):
    return render(request, 'staffweb/inicio_perfil.html')
    
#---------------------------------------------------------------------------
def inicio_noticias_eventos(request):
    raw = database.child("Anuncio").get().val() or {}
    if not isinstance(raw, dict):
        raw = {}

    def map_tipo(tipo_nombre):
        if not tipo_nombre:
            return "noticia"
        t = str(tipo_nombre).strip().lower()
        if t == "noticia":
            return "noticia"
        # si viene "evento" u otro, lo mostramos como "aviso"
        return "aviso"

    items = []
    for anuncio_id, data in raw.items():
        if not isinstance(data, dict):
            continue

        titulo = data.get("titulo", "Sin título")
        contenido = data.get("contenido", "")
        fecha_raw = data.get("fecha_emitida", "")
        id_publicador = str(data.get("id_empleador", ""))

        # nombre del tipo (si guardas "Uno"/"Dos")
        tipo_codigo = str(data.get("TipoAnuncio", "")).strip()
        tipo_nombre = None
        try:
            if tipo_codigo:
                tipo_info = database.child("TipoAnuncio").child(tipo_codigo).get().val() or {}
                tipo_nombre = tipo_info.get("nombre")  # "Noticia" o "Evento"
        except Exception:
            tipo_nombre = None

        tipo_front = map_tipo(tipo_nombre or "Noticia")

        fecha_publicacion = str(fecha_raw)

        items.append({
            "id": anuncio_id,               
            "titulo": titulo,
            "contenido": contenido,
            "tipo": tipo_front,               
            "fecha_publicacion": fecha_publicacion,
            "id_publicador": id_publicador,
        })

    # Orden por fecha
    context = {
        "announcements_json": json.dumps(items, ensure_ascii=False)
    }
    return render(request, 'staffweb/inicio_noticias_eventos.html', context)
#---------------------------------------------------------------------------    

def inicio_dashboard(request):
    return render(request, 'staffweb/inicio_dashboard.html')
    

def crear_solicitud(request):
    #TRAEMOS LOS TIPOS DE SOLICITUD
    tipos_solicitud = database.child("TiposSolicitud").get().val() or {}  #RECORDAR QUE EL NOMBRE DE TABLA DEBE SER EXACTAMENTE EL MISMO DE LA BASE DE DATOS

    #CREAMOS UNA VARIABLE PARA GUARDAR LA INFO
    tipos_solicitud_lista = []

    #AHORA INDEXAMOS POR CADA SOLICITUD Y OBTENER SU NOMBRE E ID
    for id_tipo, tipo in tipos_solicitud.items():
        nombre_tipo = tipo.get("nombre")

        tipos_solicitud_lista.append({
            "id_tipo": id_tipo,
            "nombre": nombre_tipo
        })

    #SE GUARDA EN UNA VARIABLE DE CONTEXTO TIPO DICCIONARIO
    contexto = {
        "tipos_solicitud": tipos_solicitud_lista
    }

    return render(request, 'staffweb/crear_solicitud.html', contexto)

def ver_documentos(request):
    doc_id = request.GET.get('docId')
    data = db.reference('Documentos').child(doc_id).get() if doc_id else None

    documento = None
    if data:
        raw = data.get('url')  # <- volvemos a usar la URL guardada
        nombre = data.get('nombre') or data.get('titulo') or 'Documento'

        # Detección de extensión para decidir visor
        file_name_guess = raw if isinstance(raw, str) else ''
        if file_name_guess.startswith('http') and '%2F' in file_name_guess:
            file_name_guess = unquote(file_name_guess.split('%2F')[-1])
        ext = os.path.splitext(file_name_guess)[1].lower()

        office_exts = {'.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'}
        if ext in office_exts:
            viewer_url = f"https://view.officeapps.live.com/op/view.aspx?src={unquote(raw, safe='')}"
        else:
            viewer_url = raw  # PDF/imagen u otro inline

        documento = {
            'id': doc_id,
            'title': nombre,
            'format': (data.get('tipo_documento') or ext.replace('.', '') or 'PDF').upper(),
            'size': data.get('tamano_archivo') or data.get('size') or '0MB',
            'date': data.get('Fecha_emitida') or data.get('fecha_emitida') or '',
            'filePath': viewer_url,   # para iframe
            'downloadPath': raw       # descarga directa de la misma URL
        }

    return render(request, "staffweb/ver_documentos.html", {"documento": documento})

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
    return render(request, "staffweb/modificar_usuario.html", valores)
    
def administrar_solicitudes(request):
    return render(request, "staffweb/administrar_solicitudes.html")
    
def administrar_documentos(request):

    def normalize_rut(value):
        return ''.join(ch for ch in str(value or '') if ch.isdigit())

    #Usuarios
    usuarios_raw = database.child("Usuario").get().val() or {}
    if not isinstance(usuarios_raw, dict):
        usuarios_raw = {}

    #  Documentos
    docs_ref = db.reference('Documentos')  # usas firebase_admin.db en otras vistas
    documentos_raw = docs_ref.get() or {}
    if not isinstance(documentos_raw, dict):
        documentos_raw = {}

    # Indexar documentos por RUT 
    docs_por_rut = {}
    for doc_id, data in documentos_raw.items():
        if not isinstance(data, dict):
            continue
        rut_doc = normalize_rut(data.get('id_rut') or data.get('Rut') or data.get('rut'))
        if not rut_doc:
            continue

        fecha_str = str(data.get('Fecha_emitida') or data.get('fecha_emitida') or '').strip()
        estado = 'activo'
        if not data.get('url'):
            estado = 'pendiente'
        else:
            try:
                try:
                    f = datetime.strptime(fecha_str, "%d-%m-%Y")
                except ValueError:
                    f = datetime.strptime(fecha_str, "%Y-%m-%d")
                if f < datetime.now() - timedelta(days=550):
                    estado = 'caducado'
                fecha_show = f.strftime("%d/%m/%Y")
            except Exception:
                fecha_show = fecha_str or ""
        # Objeto documento para el front
        doc = {
            "id": doc_id,
            "titulo": data.get('nombre') or data.get('titulo') or 'Documento',
            "tipo": (data.get('tipo_documento') or 'PDF').upper(),
            "fecha": fecha_show if fecha_str else "",
            "tamano": str(data.get('tamano_archivo') or data.get('size') or ''),
            "estado": estado,                        
            "url": data.get('url') or "",               
        }
        docs_por_rut.setdefault(rut_doc, []).append(doc)

    #bloques por usuario con el nombre/visual del usuario
    bloques = []
    for rut, usu in usuarios_raw.items():
        if not isinstance(usu, dict):
            continue

        nombre = f"{usu.get('Nombre','').strip()} {usu.get('ApellidoPaterno','').strip()}".strip() or "Usuario"
        rut_visible = rut 

        bloque = {
            "rut": rut,                
            "rut_visible": rut_visible, 
            "nombre": nombre,
            "documentos": docs_por_rut.get(rut, []),
        }
        bloques.append(bloque)

    context = {
        "users_docs_json": json.dumps(bloques, ensure_ascii=False)
    }
    return render(request, "staffweb/administrar_documentos.html", context)

def administrar_noticiasyeventos(request):
    return render(request, "staffweb/administrar_noticiasyeventos.html")

def administrar_logs(request):
    return render(request, "staffweb/administrar_logs.html")


# Problemas con url
def _signed_url_from_raw(raw_url_or_path, *, as_attachment=False, filename_hint=None, lifetime_hours=6):
    """Acepta una URL cruda (de la BD) o un storage path y devuelve una URL firmada."""
    if not raw_url_or_path:
        return None
    try:
        # Si viene http(s), extraigo el path real del blob
        if str(raw_url_or_path).startswith('http'):
            path = urlparse(raw_url_or_path).path  # /v0/b/<bucket>/o/<objeto-enc>
            if "/o/" not in path:
                return raw_url_or_path
            object_part = path.split("/o/", 1)[1]
            blob_name = unquote(object_part)
        else:
            blob_name = raw_url_or_path

        bucket = storage.bucket()
        blob = bucket.blob(blob_name)

        if not filename_hint:
            filename_hint = os.path.basename(blob_name)

        dispo = "attachment" if as_attachment else "inline"
        return blob.generate_signed_url(
            expiration=timedelta(hours=lifetime_hours),
            method="GET",
            response_disposition=f'{dispo}; filename="{filename_hint}"'
        )
    except Exception:
        return None
    

# def crear_publicacion(request, id_solicitud):
#     if request.method == "POST":
#         data = {
#             "titulo": request.POST.get("titulo"),
#             "contenido": request.POST.get("contenido"),
#             "autor": request.session.get("nombre_usu", "Admin"),
#             "tipo": request.POST.get("tipo", "noticia"),
#         }
#         funciones.crear_publicacion(id_solicitud, data)
#         return redirect("administrar_noticiasyeventos")
#     return render(request, "staffweb/crear_publicacion.html")

# def editar_publicacion(request, id_solicitud):
#     if request.method == "POST":
#         data = {
#             "titulo": request.POST.get("titulo"),
#             "contenido": request.POST.get("contenido"),
#             "tipo": request.POST.get("tipo", "noticia"),
#         }
#         funciones.editar_publicacion(id_solicitud, data)
#         return redirect("administrar_noticiasyeventos")
#     return render(request, "staffweb/editar_publicacion.html")

# def eliminar_publicacion(request, id_solicitud):
#     funciones.eliminar_publicacion(id_solicitud)
#     return redirect("administrar_noticiasyeventos")
