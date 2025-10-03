from datetime import datetime, timedelta
import re
import json

from django.shortcuts import render, redirect

import os, re
from django.conf import settings
from django.shortcuts import render
from urllib.parse import urlparse, unquote
from collections import Counter, defaultdict

from .funciones_dos import listar_publicaciones, crear_publicacion_funcion, modificar_publicacion, eliminar_publicacion_funcion, obtener_publicacion

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
    solicitudes_ref = db.reference("Solicitudes").get() or {}
    documentos_ref = db.reference("Documentos").get() or {}
    usuarios_ref = db.reference("Usuario").get() or {}

    # === Solicitudes por estado ===
    pendientes = aprobadas = rechazadas = 0
    total_solicitudes = len(solicitudes_ref)
    for _, data in solicitudes_ref.items():
        estado = data.get("Estado")
        if estado == "pendiente":
            pendientes += 1
        elif estado == "aprobada":
            aprobadas += 1
        elif estado == "rechazada":
            rechazadas += 1

    # === Tiempo de respuesta promedio (en días decimales) ===
    total_dias, count = 0, 0
    for _, data in solicitudes_ref.items():
        inicio = data.get("Fecha_solicitud")
        fin = data.get("Fecha_fin")
        try:
            if inicio and fin:
                inicio_dt = datetime.fromisoformat(inicio)
                fin_dt = datetime.fromisoformat(fin)
                diff_days = (fin_dt - inicio_dt).total_seconds() / 86400
                total_dias += diff_days
                count += 1
        except Exception:
            pass
    promedio_respuesta = round(total_dias / count, 1) if count > 0 else 0

    # === Documentos por mes ===
    documentos_por_mes = [0] * 12
    for _, data in documentos_ref.items():
        fecha = data.get("Fecha_emitida")
        try:
            if fecha:
                fecha_dt = datetime.fromisoformat(fecha)
                documentos_por_mes[fecha_dt.month - 1] += 1
        except Exception:
            pass

    # === Tipo de solicitudes (nombre en vez de ID) ===
    tipos_ref = db.reference("TiposSolicitud").get() or {}
    mapa_tipos = {tid: tdata.get("nombre", tid) for tid, tdata in tipos_ref.items()}
    tipos = {}
    for _, data in solicitudes_ref.items():
        tipo_id = data.get("tipo_solicitud")
        if tipo_id:
            nombre_tipo = mapa_tipos.get(tipo_id, f"Desconocido ({tipo_id})")
            tipos[nombre_tipo] = tipos.get(nombre_tipo, 0) + 1

    # Obtener fecha y semana actual
    hoy = datetime.now()
    anio_actual, semana_actual, _ = hoy.isocalendar()

    usuarios_regulares_semana_actual = 0

    for _, udata in usuarios_ref.items():
        rol = udata.get("rol")
        ultimo_login = udata.get("Ultimo_login")
        
        # Solo contar usuarios regulares
        if rol and rol != "admin" and ultimo_login:
            try:
                fecha_dt = datetime.fromisoformat(ultimo_login)
                anio, semana, _ = fecha_dt.isocalendar()
                if anio == anio_actual and semana == semana_actual:
                    usuarios_regulares_semana_actual += 1
            except Exception:
                pass

    # === Usuarios con más solicitudes ===
    contador_usuarios = Counter()
    for _, data in solicitudes_ref.items():
        usuario_id = data.get("id_rut")  # o "id_usuario" según guardes
        if usuario_id:
            contador_usuarios[usuario_id] += 1

    # Mapear IDs de usuario a nombres
    top_usuarios = []
    for uid, total in contador_usuarios.most_common(5):
        udata = usuarios_ref.get(uid, {})
        nombre = f"{udata.get('Nombre','')} {udata.get('ApellidoPaterno','')}".strip()
        top_usuarios.append({"nombre": nombre or uid, "total": total})

    # === Tasa aprobación / rechazo en el tiempo (mensual) ===
    aprobadas_por_mes = [0] * 12
    rechazadas_por_mes = [0] * 12

    for _, data in solicitudes_ref.items():
        estado = data.get("Estado")
        fecha = data.get("Fecha_fin") or data.get("Fecha_solicitud")
        try:
            if estado and fecha:
                fecha_dt = datetime.fromisoformat(fecha)
                mes_idx = fecha_dt.month - 1
                if estado == "aprobada":
                    aprobadas_por_mes[mes_idx] += 1
                elif estado == "rechazada":
                    rechazadas_por_mes[mes_idx] += 1
        except Exception:
            pass

    context = {
        "solicitudes_estado": [pendientes, aprobadas, rechazadas],
        "promedio_respuesta": promedio_respuesta,
        "documentos_por_mes": documentos_por_mes,
        "tipos_solicitudes": tipos,

        "total_solicitudes": total_solicitudes,
        "documentos_disponibles": len(documentos_ref),
        "usuarios_regulares_semana_actual": usuarios_regulares_semana_actual,
        "top_usuarios": top_usuarios,
        "aprobadas_por_mes": aprobadas_por_mes,
        "rechazadas_por_mes": rechazadas_por_mes,
    }
    return render(request, "staffweb/inicio_dashboard.html", context)
    

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


#---------------------------------------------------------------------Administración de documentos ------------------------------------------   
def administrar_documentos(request):

    def normalize_rut(value):
        return ''.join(ch for ch in str(value or '') if ch.isdigit())

    #Usuarios
    usuarios_raw = database.child("Usuario").get().val() or {}
    if not isinstance(usuarios_raw, dict):
        usuarios_raw = {}

    #  Documentos
    docs_ref = db.reference('Documentos') 
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

def crear_documento(request):
    return render(request, "staffweb/crear_documento.html")

def documentos_usuarios(request):

    def normalize_rut(value: str) -> str:
        return ''.join(ch for ch in str(value or '') if ch.isdigit())

    def formatear_rut(rut_limpio: str) -> str:
        if not rut_limpio:
            return ""
        rut_sin_dv, dv = rut_limpio[:-1], rut_limpio[-1]
        partes = []
        while len(rut_sin_dv) > 3:
            partes.insert(0, rut_sin_dv[-3:])
            rut_sin_dv = rut_sin_dv[:-3]
        partes.insert(0, rut_sin_dv)
        return f"{'.'.join(partes)}-{dv}"

    def calcular_estado_y_fecha(fecha_str: str, url: str):
        fecha_str = (fecha_str or "").strip()
        estado = 'pendiente' if not url else 'activo'
        fecha_show = fecha_str
        if url and fecha_str:
            try:
                try:
                    f = datetime.strptime(fecha_str, "%d-%m-%Y")
                except ValueError:
                    f = datetime.strptime(fecha_str, "%Y-%m-%d")
                if f < datetime.now() - timedelta(days=550):
                    estado = 'caducado'
                fecha_show = f.strftime("%d/%m/%Y")
            except Exception:
                fecha_show = fecha_str
        return estado, fecha_show

    rut_qs = normalize_rut(request.GET.get("rut", ""))
    if not rut_qs:
        return redirect("administrar_documentos")

    # Usuario 
    usuario_raw = database.child("Usuario").child(rut_qs).get().val() or {}
    nombre = f"{usuario_raw.get('Nombre','').strip()} {usuario_raw.get('ApellidoPaterno','').strip()}".strip() or rut_qs
    usuario = {"nombre": nombre, "rut": formatear_rut(rut_qs)}

    # Documentos del usuario 
    documentos_raw = db.reference('Documentos').get() or {}
    documentos = []
    for doc_id, data in (documentos_raw or {}).items():
        if not isinstance(data, dict):
            continue
        rut_doc = normalize_rut(data.get('id_rut') or data.get('Rut') or data.get('rut'))
        if rut_doc != rut_qs:
            continue

        fecha_db = str(data.get('Fecha_emitida') or data.get('fecha_emitida') or '')
        url = data.get('url') or ''
        estado, fecha_show = calcular_estado_y_fecha(fecha_db, url)

        documentos.append({
            "id": doc_id,
            "nombre": data.get('nombre') or data.get('titulo') or 'Documento',
            "estado": estado,                       # activo/pendiente/caducado
            "fecha_subida": fecha_show or "",
            "url": url,                             # para botón Ver
            "tipo_documento": (data.get('tipo_documento') or 'PDF').upper(),
            "tamano_archivo": str(data.get('tamano_archivo') or data.get('size') or ''),
            "fecha_sort": fecha_db,                 # opcional para ordenar en el front si quieres
        })

    context = {
        "user_json": json.dumps(usuario, ensure_ascii=False),
        "docs_json": json.dumps(documentos, ensure_ascii=False),
    }
    return render(request, "staffweb/documentos_usuarios.html", context)
#---------------------------------------------------------------------------------------------------------------------------------------

#def administrar_noticiasyeventos(request):
#    return render(request, "staffweb/administrar_noticiasyeventos.html")

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

#--------------------------------------------------------------------------------#

def crear_noticiasyeventos(request):
    return render(request, "staffweb/crear_noticiasyeventos.html")


def administrar_noticiasyeventos(request):
    anuncios = listar_publicaciones()
    publicaciones = {}

    for key, val in anuncios.items():
        publicaciones[key] = {
            "titulo": val.get("titulo", ""),
            "contenido": val.get("contenido", ""),
            "fecha": val.get("fecha_emitida", ""),
            "autor": val.get("id_empleador", ""),
            "tipo": val.get("TipoAnuncio", "")
        }

    return render(request, "staffweb/administrar_noticiasyeventos.html", {
        "publicaciones": publicaciones
    })

# Crear
def crear_publicacion(request):
    if request.method == "POST":
        data = {
            "titulo": request.POST.get("titulo"),
            "contenido": request.POST.get("contenido"),
            "fecha_emitida": request.POST.get("fecha"),
            "id_empleador": request.POST.get("autor"),
            "TipoAnuncio": request.POST.get("tipo")
        }
        crear_publicacion_funcion(data)
        return redirect("administrar_noticiasyeventos")

    return render(request, "staffweb/crear_noticiasyeventos.html")

# Editar
def editar_publicacion(request, pub_id):
    publicacion = obtener_publicacion(pub_id)

    if request.method == "POST":
        data = {
            "titulo": request.POST.get("titulo"),
            "contenido": request.POST.get("contenido"),
            "fecha_emitida": request.POST.get("fecha"),
            "id_empleador": request.POST.get("autor"),
            "TipoAnuncio": request.POST.get("tipo")
        }
        modificar_publicacion(pub_id, data)
        return redirect("administrar_noticiasyeventos")

    return render(request, "staffweb/crear_noticiasyeventos.html", {
        "publicacion": publicacion,
        "pub_id": pub_id
    })

# Eliminar
def eliminar_publicacion(request, pub_id):
    eliminar_publicacion_funcion(pub_id)
    return redirect("administrar_noticiasyeventos")