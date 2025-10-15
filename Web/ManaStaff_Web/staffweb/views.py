from datetime import datetime, timedelta
import re, json, uuid, os, re, mimetypes

from django.conf import settings
from django.urls import reverse
from django.http import JsonResponse
from django.contrib import messages
from django.shortcuts import render, redirect
from django.views.decorators.http import require_POST
from django.utils.safestring import mark_safe
from urllib.parse import urlparse, unquote, quote, unquote_plus
from collections import Counter, defaultdict

import requests

from .funciones_dos import verificar_contrasena_actual, actualizar_contrasena, obtener_datos_usuario, actualizar_datos_usuario, listar_publicaciones, crear_publicacion_funcion, modificar_publicacion, eliminar_publicacion_funcion, obtener_publicacion
from .decorators import admin_required
#IMPORTS DE FIREBASE
from firebase_admin import auth
from .firebase import firebase, db, storage, database

# VARIABLES FIREBASE
database = firebase.database()
authP = firebase.auth()



def index(request):
    mensaje = request.session.pop("mensaje_expiracion", "")
    return render(request, 'staffweb/index.html', {"mensaje": mensaje})

def recuperar_contrasena(request):
    return render(request, 'staffweb/recuperar_contrasena.html')

def inicio_solicitudes(request):
    return render(request, 'staffweb/inicio_solicitudes.html')

def administrar_logs(request):
    return render(request, 'staffweb/administrar_logs.html')

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
@admin_required
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
@admin_required
def panel_administrar(request):
    return render(request, "staffweb/panel_administrar.html")

@admin_required
def administrar_usuarios(request):
    return render(request, "staffweb/administrar_usuarios.html")

@admin_required
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

@admin_required
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
    
@admin_required
def administrar_solicitudes(request):
    return render(request, "staffweb/administrar_solicitudes.html")


#---------------------------------------------------------------------Administración de documentos ------------------------------------------   
def _safe_filename(filename: str) -> str:
    base = os.path.basename(filename or "archivo")
    base = re.sub(r"[^A-Za-z0-9_.-]+", "_", base)
    base = base.lstrip(".") or "archivo"
    return base

def _parse_date_multi(s: str):
    if not s:
        return None
    s = str(s).strip()
    fmts = (
        "%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y",
        "%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M",
        "%Y-%m-%d %H:%M:%S.%f"
    )
    for fmt in fmts:
        try:
            dt = datetime.strptime(s, fmt)
            return dt.date()
        except ValueError:
            continue
    return None

def _tipoestado_codes():
    try:
        raw = database.child("Tipoestado").get().val() or {}
    except Exception:
        raw = {}

    name_to_code, code_to_name = {}, {}
    if isinstance(raw, dict):
        for code, val in raw.items():
            nombre = val.get("nombre") if isinstance(val, dict) else val
            nombre = str(nombre or "").strip().lower()
            code = str(code or "").strip()
            if not nombre or not code:
                continue
            code_to_name[code] = nombre
            name_to_code[nombre] = code

    # fallbacks
    code_to_name.setdefault("Uno", "activo")
    code_to_name.setdefault("Dos", "pendiente")
    code_to_name.setdefault("Tres", "caducado")
    name_to_code.setdefault("activo", "Uno")
    name_to_code.setdefault("pendiente", "Dos")
    name_to_code.setdefault("caducado", "Tres")
    return name_to_code, code_to_name

def _normalize_rut(value):
    #Limpia el rut y devuelve solo los dígitos
    return ''.join(ch for ch in str(value or '') if ch.isdigit())

def _ext_to_type(filename):
    #Obtiene el tipo de documento a partir de la extensión del archivo
    ext = os.path.splitext(filename or '')[1].lower().replace('.', '')
    #Devolvemos la extensión en mayúsculas, por defecto PDF
    return (ext or 'pdf').upper()


def _size_to_mb_str(django_file):
    #Convierte el tamaño del archivo a una cadena en MB con el formato 'Nmb'
    #- Redondea al entero más cercano y nunca baja de 1mb
    #- Si no hay archivo (None), devuelve ''
    #Si no se envió archivo, no hay tamaño que mostrar
    if not django_file:
        return ""
    #lo pasamos a megabytes
    mb = django_file.size / (1024 * 1024)
    return f"{max(1, round(mb))}mb"

@admin_required
def administrar_documentos(request):
    # Mapeos de Tipoestado
    name_to_code, code_to_name = _tipoestado_codes()

    # Usuarios
    usuarios_raw = database.child("Usuario").get().val() or {}
    if not isinstance(usuarios_raw, dict):
        usuarios_raw = {}

    # Documentos
    docs_ref = db.reference('Documentos')
    documentos_raw = docs_ref.get() or {}
    if not isinstance(documentos_raw, dict):
        documentos_raw = {}

    # Indexar documentos por RUT
    docs_por_rut = {}
    AUTO_FIX_CADUCADO = True  

    for doc_id, data in documentos_raw.items():
        if not isinstance(data, dict):
            continue

        rut_doc = _normalize_rut(data.get('id_rut') or data.get('Rut') or data.get('rut'))
        if not rut_doc:
            continue

        # Base de estado desde Tipoestado/url
        tipoestado_code = str(data.get('Tipoestado') or data.get('tipoestado') or '').strip()
        url_archivo = str(data.get('url') or '').strip()
        estado = code_to_name.get(tipoestado_code)
        if not estado:
            estado = 'pendiente' if not url_archivo else 'activo'

        # Fechas
        fecha_emitida_raw = str(data.get('Fecha_emitida') or data.get('fecha_emitida') or '').strip()
        fe_date = _parse_date_multi(fecha_emitida_raw)
        fecha_show = fe_date.strftime("%d/%m/%Y") if fe_date else ""

        fv_raw = str(data.get("fecha_vencimiento") or "").strip()
        fv_date = _parse_date_multi(fv_raw)
        hoy = datetime.now().date()

        # Caducidad por vencimiento
        if fv_date and fv_date < hoy:
            estado = 'caducado'
            if AUTO_FIX_CADUCADO:
                try:
                    code_cad = name_to_code.get("caducado", "Tres")
                    if tipoestado_code != code_cad:
                        db.reference("Documentos").child(doc_id).update({"Tipoestado": code_cad})
                except Exception:
                    pass
        else:
            # Fallback: sin vencimiento y muy antiguo => caducado (~18 meses)
            if not fv_date and fe_date:
                try:
                    if fe_date < (hoy - timedelta(days=550)):
                        estado = 'caducado'
                except Exception:
                    pass

        # Objeto para el front
        doc = {
            "id": doc_id,
            "titulo": data.get('nombre') or data.get('titulo') or 'Documento',
            "tipo": (data.get('tipo_documento') or 'PDF').upper(),
            "fecha": fecha_show,
            "tamano": str(data.get('tamano_archivo') or data.get('size') or ''),
            "estado": estado,
            "url": url_archivo,
        }
        docs_por_rut.setdefault(rut_doc, []).append(doc)

    # Bloques por usuario
    bloques = []
    for rut, usu in usuarios_raw.items():
        if not isinstance(usu, dict):
            continue
        nombre = f"{(usu.get('Nombre','') or '').strip()} {(usu.get('ApellidoPaterno','') or '').strip()}".strip() or "Usuario"
        bloques.append({
            "rut": rut,
            "rut_visible": rut,
            "nombre": nombre,
            "documentos": docs_por_rut.get(rut, []),
        })

    context = {"users_docs_json": json.dumps(bloques, ensure_ascii=False)}
    return render(request, "staffweb/administrar_documentos.html", context)

@admin_required
def crear_documento(request):
    if request.method == "POST":
        # Validación y normalización
        nombre_doc = (request.POST.get("documentName") or "").strip()
        estado_sel = (request.POST.get("documentStatus") or "").strip().lower()
        rut_sel    = _normalize_rut(request.POST.get("selectedUserId"))
        fecha_venc = (request.POST.get("expirationDate") or "").strip()

        file = request.FILES.get("documentFile")

        if not nombre_doc:
            messages.error(request, "El nombre del documento es obligatorio.")
            return redirect("crear_documento")
        if not rut_sel:
            messages.error(request, "Debes seleccionar un usuario.")
            return redirect("crear_documento")
        if estado_sel not in {"activo", "pendiente"}:
            messages.error(request, "Estado inválido.")
            return redirect("crear_documento")

        if estado_sel == "activo" and not file:
            messages.error(request, "Para estado ACTIVO debes subir un archivo.")
            return redirect("crear_documento")

        # Mapear Tipoestado
        name_to_code, _ = _tipoestado_codes()
        tipoestado_code = name_to_code.get(estado_sel, "Uno")

        # Datos base
        ahora_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        id_empleador   = _normalize_rut(request.session.get("usuario_rut") or request.session.get("usuario_id") or "1111111111")
        tipo_doc       = _ext_to_type(file.name) if file else "PDF"
        tamano_archivo = _size_to_mb_str(file)

        # id del doc
        doc_id = f"IdDoc_{uuid.uuid4().hex[:10]}"

        # Subir a storage si hay archivo
        download_url  = ""
        storage_path  = ""
        storage_bucket = "" 

        if file:
            bucket = storage.bucket()
            safe_name = _safe_filename(file.name)
            blob_name = f"{rut_sel}/Documentos/{doc_id}/{safe_name}" 
            blob = bucket.blob(blob_name)

            content_type = file.content_type or mimetypes.guess_type(safe_name)[0] or "application/octet-stream"
            token = uuid.uuid4().hex
            blob.metadata = {"firebaseStorageDownloadTokens": token}

            blob.upload_from_file(file, content_type=content_type)

            quoted = quote(blob_name, safe="")
            download_url   = f"https://firebasestorage.googleapis.com/v0/b/{bucket.name}/o/{quoted}?alt=media&token={token}"
            storage_path   = blob_name     
            storage_bucket = bucket.name        

        # Guardar en realtime 
        data = {
            "Fecha_emitida": ahora_str,
            "Tipoestado": tipoestado_code,
            "id_empleador": id_empleador,
            "id_rut": rut_sel,
            "nombre": nombre_doc,
            "tamano_archivo": tamano_archivo,
            "tipo_documento": tipo_doc,
            "url": download_url,
            "storage_path": storage_path,   
            "storage_bucket": storage_bucket
        }
        if fecha_venc:
            data["fecha_vencimiento"] = fecha_venc

        try:
            db.reference("Documentos").child(doc_id).set(data)
            messages.success(request, "Documento creado correctamente.")
        except Exception:
            messages.error(request, "Hubo un problema guardando el documento.")

        return redirect(reverse("crear_documento"))

    # GET 
    usuarios_raw = database.child("Usuario").get().val() or {}
    usuarios_lista = []
    if isinstance(usuarios_raw, dict):
        for rut, u in usuarios_raw.items():
            if not isinstance(u, dict):
                continue
            nombre = f"{(u.get('Nombre') or '').strip()} {(u.get('ApellidoPaterno') or '').strip()}".strip() or rut
            usuarios_lista.append({
                "rut": str(rut),
                "rut_visible": str(rut),
                "nombre": nombre
            })

    name_to_code, _ = _tipoestado_codes()
    estados_json = {
        "activo": name_to_code.get("activo", "Uno"),
        "pendiente": name_to_code.get("pendiente", "Dos"),
    }

    ctx = {
        "usuarios_json": json.dumps(usuarios_lista, ensure_ascii=False),
        "estados_json": json.dumps(estados_json, ensure_ascii=False),
    }
    return render(request, "staffweb/crear_documento.html", ctx)

@admin_required
def documentos_usuarios(request):
    name_to_code, code_to_name = _tipoestado_codes()

    rut_qs = request.GET.get('rut', '')
    rut_norm = _normalize_rut(rut_qs)

    # Usuario
    usuario = {"nombre": "Usuario", "rut": rut_norm, "rut_visible": rut_norm}
    try:
        user_raw = database.child("Usuario").child(rut_norm).get().val()
        if not isinstance(user_raw, dict):
            todos_users = database.child("Usuario").get().val() or {}
            if isinstance(todos_users, dict):
                user_raw = todos_users.get(rut_norm)
        if isinstance(user_raw, dict):
            nombre = f"{(user_raw.get('Nombre') or '').strip()} {(user_raw.get('ApellidoPaterno') or '').strip()}".strip() or "Usuario"
            usuario["nombre"] = nombre
            usuario["imagen"] = user_raw.get("imagen") or ""
    except Exception:
        pass

    def _calcular_estado_y_fecha(fecha_emitida_str, url, tipoestado_code, fecha_vencimiento_str):
        estado = code_to_name.get(str(tipoestado_code or '').strip())
        if not estado:
            estado = 'pendiente' if not url else 'activo'

        fe_date = _parse_date_multi(fecha_emitida_str)
        fecha_show = fe_date.strftime("%d/%m/%Y") if fe_date else ""

        fv_date = _parse_date_multi(fecha_vencimiento_str)
        hoy = datetime.now().date()

        if fv_date and fv_date < hoy:
            estado = 'caducado'
        else:
            if not fv_date and fe_date:
                try:
                    if fe_date < (hoy - timedelta(days=550)):
                        estado = 'caducado'
                except Exception:
                    pass
        return estado, fecha_show

    documentos = []
    try:
        docs_raw = db.reference('Documentos').get() or {}
        if not isinstance(docs_raw, dict):
            docs_raw = {}
    except Exception:
        docs_raw = {}

    for doc_id, data in docs_raw.items():
        if not isinstance(data, dict):
            continue

        rut_doc = _normalize_rut(data.get('id_rut') or data.get('Rut') or data.get('rut'))
        if rut_doc != rut_norm:
            continue

        estado, fecha_show = _calcular_estado_y_fecha(
            data.get('Fecha_emitida') or data.get('fecha_emitida'),
            data.get('url'),
            data.get('Tipoestado') or data.get('tipoestado'),
            data.get('fecha_vencimiento') or ""
        )

        documentos.append({
            "id": doc_id,
            "nombre": data.get('nombre') or data.get('titulo') or 'Documento',
            "estado": estado,
            "fecha_subida": fecha_show,
            "url": data.get('url') or "",
            "tipo": (data.get('tipo_documento') or 'PDF').upper(),
            "tamano": str(data.get('tamano_archivo') or data.get('size') or ''),
        })

    context = {
        "usuario_json": json.dumps(usuario, ensure_ascii=False),
        "documentos_json": json.dumps(documentos, ensure_ascii=False),
    }
    return render(request, "staffweb/documentos_usuarios.html", context)
#-------Modificar documento
def _extract_filename_from_storage_data(data: dict) -> str:

    storage_path = str((data or {}).get("storage_path") or "").strip()
    if storage_path:
        return os.path.basename(storage_path)
    # fallback
    raw_url = str((data or {}).get("url") or "").strip()
    if raw_url:
        try:
            object_enc = urlparse(raw_url).path.split("/o/", 1)[1]
            blob_name = unquote(object_enc)
            return os.path.basename(blob_name)
        except Exception:
            pass
    return ""

def _delete_old_blob_if_exists(data: dict):
    #Borra archivo antiguo en Storage
    try:
        storage_path = str((data or {}).get("storage_path") or "").strip()
        bucket_name  = str((data or {}).get("storage_bucket") or "").strip()
        raw_url      = str((data or {}).get("url") or "").strip()

        bucket = storage.bucket(bucket_name) if bucket_name else storage.bucket()

        if storage_path:
            blob = bucket.blob(storage_path)
            try:
                if hasattr(blob, "exists"):
                    if blob.exists():
                        blob.delete()
                else:
                    blob.delete()
                return True
            except Exception:
                return False
        elif raw_url.startswith("http"):
            bname, blob_name = _infer_blob_from_download_url(raw_url)
            bucket2 = storage.bucket(bname) if bname else bucket
            if blob_name:
                blob = bucket2.blob(blob_name)
                try:
                    if hasattr(blob, "exists"):
                        if blob.exists():
                            blob.delete()
                    else:
                        blob.delete()
                    return True
                except Exception:
                    return False
    except Exception:
        return False
    return False


@admin_required
def modificar_documento(request, doc_id):
    # Obtener documento
    ref = db.reference("Documentos").child(doc_id)
    data = ref.get() or None
    if not data or not isinstance(data, dict):
        messages.error(request, "Documento no encontrado.")
        return redirect("administrar_documentos")

    # Mapeo de estados
    name_to_code, code_to_name = _tipoestado_codes()

    # Normalizar usuario dueño
    rut_sel = _normalize_rut(data.get("id_rut") or data.get("Rut") or data.get("rut"))

    # Usuario
    usuario = {"nombre": "Usuario", "rut": rut_sel, "rut_visible": rut_sel}
    try:
        user_raw = database.child("Usuario").child(rut_sel).get().val()
        if isinstance(user_raw, dict):
            nombre = f"{(user_raw.get('Nombre') or '').strip()} {(user_raw.get('ApellidoPaterno') or '').strip()}".strip() or "Usuario"
            usuario["nombre"] = nombre
    except Exception:
        pass

    if request.method == "POST":
        # Procesar actualización
        nombre_doc = (request.POST.get("documentName") or "").strip()
        estado_sel = (request.POST.get("documentStatus") or "").strip().lower()
        fecha_venc = (request.POST.get("expirationDate") or "").strip()
        file = request.FILES.get("documentFile")

        if not nombre_doc:
            return JsonResponse({"ok": False, "error": "El nombre del documento es obligatorio."}, status=400)
        if estado_sel not in {"activo", "pendiente"}:
            return JsonResponse({"ok": False, "error": "Estado inválido."}, status=400)

        # regla: si se marca activo y no hay archivo actual ni se adjunta nuevo, error
        had_url = bool(str(data.get("url") or "").strip())
        if estado_sel == "activo" and not had_url and not file:
            return JsonResponse({"ok": False, "error": "Para estado ACTIVO debes subir un archivo."}, status=400)

        tipoestado_code = name_to_code.get(estado_sel, "Uno")

        # subida opcional de archivo nuevo y se borraria el anterior
        download_url   = data.get("url") or ""
        storage_path   = data.get("storage_path") or ""
        storage_bucket = data.get("storage_bucket") or ""
        tipo_doc       = data.get("tipo_documento") or "PDF"
        tamano_archivo = data.get("tamano_archivo") or ""

        if file:
            # borro el antiguo si había
            _delete_old_blob_if_exists(data)

            # subo el nuevo
            bucket = storage.bucket()
            safe_name = _safe_filename(file.name)
            blob_name = f"{rut_sel}/Documentos/{doc_id}/{safe_name}"
            blob = bucket.blob(blob_name)

            content_type = file.content_type or mimetypes.guess_type(safe_name)[0] or "application/octet-stream"
            token = uuid.uuid4().hex
            blob.metadata = {"firebaseStorageDownloadTokens": token}
            blob.upload_from_file(file, content_type=content_type)

            quoted = quote(blob_name, safe="")
            download_url   = f"https://firebasestorage.googleapis.com/v0/b/{bucket.name}/o/{quoted}?alt=media&token={token}"
            storage_path   = blob_name
            storage_bucket = bucket.name
            tipo_doc       = _ext_to_type(file.name)
            tamano_archivo = _size_to_mb_str(file)

        # armo payload de actualización
        update_payload = {
            "nombre": nombre_doc,
            "Tipoestado": tipoestado_code,
            "url": download_url,
            "storage_path": storage_path,
            "storage_bucket": storage_bucket,
            "tipo_documento": tipo_doc,
            "tamano_archivo": tamano_archivo,
        }
        # fecha de vencimiento
        if fecha_venc:
            update_payload["fecha_vencimiento"] = fecha_venc
        else:
            # limpiar key si existía
            if "fecha_vencimiento" in data:
                update_payload["fecha_vencimiento"] = None  

        try:
            ref.update(update_payload)
        except Exception:
            return JsonResponse({"ok": False, "error": "No se pudo actualizar el documento."}, status=500)

        # a dónde volver
        next_url = request.GET.get("next") or reverse("administrar_documentos")
        return JsonResponse({"ok": True, "redirect_url": next_url})

    # GET 
    # normalizar estado y fechas para el front
    estado = code_to_name.get(str(data.get("Tipoestado") or "").strip()) or ("pendiente" if not data.get("url") else "activo")
    fecha_venc = str(data.get("fecha_vencimiento") or "").strip()
    # si viene en formatos raros, tratar de normalizar a YYYY-MM-DD
    def _to_yyyy_mm_dd(s):
        s = (s or "").strip()
        if not s:
            return ""
        for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%d %H:%M:%S.%f"):
            try:
                return datetime.strptime(s, fmt).strftime("%Y-%m-%d")
            except ValueError:
                continue
        return s 

    doc_json = {
        "id": doc_id,
        "nombre": data.get("nombre") or data.get("titulo") or "Documento",
        "estado": estado,
        "url": data.get("url") or "",
        "archivo_nombre": _extract_filename_from_storage_data(data),
        "fecha_emitida": str(data.get("Fecha_emitida") or ""),
        "fecha_vencimiento": _to_yyyy_mm_dd(fecha_venc),
        "tipo_documento": (data.get("tipo_documento") or "PDF").upper(),
        "tamano": str(data.get("tamano_archivo") or data.get("size") or ""),
        "rut": rut_sel,
    }

    ctx = {
        "doc_id": doc_id,
        "usuario_json": json.dumps(usuario, ensure_ascii=False),
        "doc_json": json.dumps(doc_json, ensure_ascii=False),
        "next_url": request.GET.get("next") or "",
    }
    return render(request, "staffweb/modificar_documento.html", ctx)
#Eliminar documento
def _infer_blob_from_download_url(url: str):
    try:
        path = urlparse(url).path
        if "/o/" not in path:
            return None, None
        left, object_enc = path.split("/o/", 1)
        blob_name = unquote(object_enc)
        bucket_name = None
        if "/b/" in left:
            bucket_name = left.split("/b/", 1)[1].split("/")[0]
        return bucket_name, blob_name
    except Exception:
        return None, None

@admin_required
@require_POST
def eliminar_documento(request):
    try:
        payload = json.loads(request.body.decode("utf-8"))
    except Exception:
        return JsonResponse({"ok": False, "error": "JSON inválido."}, status=400)

    doc_id = str(payload.get("doc_id") or "").strip()
    if not doc_id:
        return JsonResponse({"ok": False, "error": "doc_id requerido."}, status=400)

    ref = db.reference("Documentos").child(doc_id)
    data = ref.get()
    if not data:
        return JsonResponse({"ok": False, "error": "Documento no existe."}, status=404)

    storage_deleted = False
    #Borrar archivo en Storage
    try:
        storage_path = str(data.get("storage_path") or "").strip()
        bucket_name  = str(data.get("storage_bucket") or "").strip()
        raw_url      = str(data.get("url") or "").strip()

        bucket = storage.bucket(bucket_name) if bucket_name else storage.bucket()

        if storage_path:
            # Borrado con ruta exacta guardada
            blob = bucket.blob(storage_path)
            try:
                if hasattr(blob, "exists"):
                    if blob.exists():
                        blob.delete()
                else:
                    blob.delete()
                storage_deleted = True
            except Exception:
                pass
        elif raw_url.startswith("http"):
            # Fallback
            bname, blob_name = _infer_blob_from_download_url(raw_url)
            bucket2 = storage.bucket(bname) if bname else bucket
            if blob_name:
                blob = bucket2.blob(blob_name)
                try:
                    if hasattr(blob, "exists"):
                        if blob.exists():
                            blob.delete()
                    else:
                        blob.delete()
                    storage_deleted = True
                except Exception:
                    pass
    except Exception:
        pass

    # Borrar nodo en realtime
    try:
        ref.delete()
    except Exception:
        return JsonResponse({"ok": False, "error": "No se pudo eliminar en la base de datos."}, status=500)

    return JsonResponse({"ok": True, "storage_deleted": storage_deleted})
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

@admin_required
def editar_noticiasyeventos(request):
    return render(request, "staffweb/editar_noticiasyeventos.html")

@admin_required
def crear_publicacion(request):
    return render(request, "staffweb/crear_publicacion.html")

@admin_required
def administrar_noticiasyeventos(request):
    anuncios = listar_publicaciones()
    publicaciones = {}

    for key, val in anuncios.items():
        publicaciones[key] = {
            "id": key,
            "titulo": val.get("titulo", ""),
            "contenido": val.get("contenido", ""),
            "fecha": val.get("fecha_emitida", ""),
            "autor": f"{database.child('Usuario').child(val.get('id_empleador', '')).get().val().get('Nombre', '')} {database.child('Usuario').child(val.get('id_empleador', '')).get().val().get('ApellidoPaterno', '')}",
            "tipo": database.child('TipoAnuncio').child((val.get("TipoAnuncio", ""))).get().val().get('nombre')
        }

    return render(request, "staffweb/administrar_noticiasyeventos.html", {
        "publicaciones": mark_safe(json.dumps(list(publicaciones.values())))
    })

# Crear
@admin_required
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

    return render(request, "staffweb/editar_noticiasyeventos.html")

# Editar
@admin_required
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

    return render(request, "staffweb/editar_noticiasyeventos.html", {
        "publicacion": publicacion,
        "pub_id": pub_id
    })

# Eliminar
@admin_required
def eliminar_publicacion(request, pub_id):
    eliminar_publicacion_funcion(pub_id)
    return redirect("administrar_noticiasyeventos")


#--------------------------------------------------------------------------------#
def inicio_perfil(request):
    # Datos básicos desde sesión
    nombre_usu = (request.session.get('nombre_usu') or '').strip()
    apellido_usu_sesion = (request.session.get('apellido_usu') or '').strip()
    correo_usu = (request.session.get('correo_usu') or '').strip()
    cargo_usu = (request.session.get('cargo_usu') or '').strip()
    rol_usu = (request.session.get('rol_usu') or '').strip()
    idusu = (request.session.get('usuario_id') or '').strip()

    # Rol (tolerante a None)
    roldatabase = database.child('Rol').child(rol_usu).get().val() or {}
    nombrerol = (roldatabase.get('nombre') or rol_usu or '').strip()

    # Usuario en Firebase
    usuariodatabase = database.child('Usuario').child(idusu).get().val() or {}
    celular = (usuariodatabase.get('Telefono') or '').strip()
    direccion = (usuariodatabase.get('Direccion') or '').strip()

    # Apellidos combinados desde Firebase 
    ap_paterno = (usuariodatabase.get('ApellidoPaterno') or '').strip()
    ap_materno = (usuariodatabase.get('ApellidoMaterno') or '').strip()
    apellido_usu = (f"{ap_paterno} {ap_materno}".strip() or apellido_usu_sesion)

    # Imagen 
    url_imagen_usuario = (
        request.session.get('url_imagen_usuario')
        or usuariodatabase.get('imagen')
        or ''
    )

    contexto = {
        'nombre_usu': nombre_usu,
        'apellido_usu': apellido_usu,
        'correo_usu': correo_usu,
        'cargo_usu': cargo_usu,
        'rol_usu': rol_usu,
        'nombrerol': nombrerol,
        'celular': celular,
        'direccion': direccion,
        'url_imagen_usuario': url_imagen_usuario,
    }
    return render(request, 'staffweb/inicio_perfil.html', contexto)

def perfil(request):
    usuario_id = request.session.get('usuario_id')
    if not usuario_id:
        messages.error(request, "No se encontró la sesión del usuario.")
        return redirect('login')

    if request.method != "POST":
        return redirect('inicio_perfil')

    nuevo_celular = (request.POST.get("celular") or "").strip()
    nueva_direccion = (request.POST.get("direccion") or "").strip()
    nueva_imagen = request.FILES.get("imagen", None)

    if not nuevo_celular or not nueva_direccion:
        messages.warning(request, "Por favor completa ambos campos.")
        return redirect('inicio_perfil')

    usuario_actual = database.child("Usuario").child(usuario_id).get().val() or {}
    imagen_actual_url = (usuario_actual.get('imagen') or '').strip()

    if nueva_imagen:
        # Validación
        ext = nueva_imagen.name.split(".")[-1].lower()
        if ext not in {"jpg", "jpeg", "png", "gif"}:
            messages.error(request, "Imagen no permitida (JPG, JPEG, PNG, GIF).")
            return redirect('inicio_perfil')

        bucket = storage.bucket()

        # Borrar imagen anterior si existe 
        if imagen_actual_url:
            try:
                parsed = urlparse(imagen_actual_url)
                last_segment = (parsed.path.split('/')[-1] if parsed.path else '').split('?')[0]
                nombre_archivo_viejo = unquote_plus(last_segment) if last_segment else None
                if nombre_archivo_viejo:
                    old_blob = bucket.blob(f"{usuario_id}/Imagen/{nombre_archivo_viejo}")
                    if old_blob.exists():
                        old_blob.delete()
            except Exception:
                pass

        #Subir la nueva imagen
        try:
            new_blob = bucket.blob(f"{usuario_id}/Imagen/{nueva_imagen.name}")
            new_blob.upload_from_file(nueva_imagen, content_type=nueva_imagen.content_type)
            new_blob.cache_control = "public, max-age=3600, s-maxage=86400"
            new_blob.patch()

            imagen_actual_url = new_blob.generate_signed_url(
                expiration=timedelta(weeks=150),
                method="GET"
            )
        except Exception as e:
            messages.error(request, "No se pudo subir la nueva imagen.")
            return redirect('inicio_perfil')

    # Actualizar datos en Firebase 
    try:
        actualizar_datos_usuario(usuario_id, nuevo_celular, nueva_direccion, imagen_actual_url)
    except Exception:
        messages.error(request, "No se pudieron actualizar los datos.")
        return redirect('inicio_perfil')

    # Refrescar URL de imagen en sesión para que el template la tome
    request.session['url_imagen_usuario'] = imagen_actual_url

    messages.success(request, "Datos guardados correctamente.")
    return redirect('inicio_perfil')

#ERROR 403 (ACCESO DENEGADO)
def error_403(request, exception=None):
    return render(request, "staffweb/403.html", status=403)

#----------------------------------------------------------------------------------------------------#

def cambiar_contrasena_funcion(request, rut):
    password_actual = request.POST.get("password_actual", "").strip()
    password_nueva = request.POST.get("nueva_password", "").strip()
    password_repetir = request.POST.get("confirmar_password", "").strip()

    if not all([password_actual, password_nueva, password_repetir]):
        return JsonResponse({"status": "false", "message": "Todos los campos son obligatorios."})

    if password_nueva != password_repetir:
        return JsonResponse({"status": "false", "message": "Las nuevas contraseñas no coinciden."})

    if len(password_nueva) < 6:
        return JsonResponse({"status": "false", "message": "La nueva contraseña debe tener al menos 6 caracteres."})

    # Obtener email del usuario según su RUT
    usuario_ref = database.child(f"Usuario/{rut}").get().val()
    if not usuario_ref:
        return JsonResponse({"status": "false", "message": "Usuario no encontrado."})

    email = usuario_ref.get("correo")


    try:

        api_key = "AIzaSyDrogTFQNg_BNb1qmkIhJ6cpppzPw-DLOo"
        url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={api_key}"
        payload = {
            "email": email,
            "password": password_actual,
            "returnSecureToken": True
        }
        r = requests.post(url, json=payload)
        resp = r.json()

        if "error" in resp:
            # Firebase retorna algo así: {"error":{"code":400,"message":"INVALID_PASSWORD","errors":[...]}}
            return JsonResponse({"status": "false", "message": "La contraseña actual es incorrecta."})

        # Actualizar contraseña
        user = auth.get_user_by_email(email)
        auth.update_user(user.uid, password=password_nueva)

    except Exception as e:
        return JsonResponse({"status": "false", "message": f"Error al cambiar contraseña: {e}"})

    return JsonResponse({"status": "success", "message": "Contraseña actualizada correctamente."})

#----------------------------------------------------------------------------------------------------#

def cambiar_pin_funcion(request, rut):
    pin_actual = request.POST.get("pin_actual", "").strip()
    pin_nueva = request.POST.get("pin_nueva", "").strip()
    pin_confirmar = request.POST.get("pin_confirmar", "").strip()

    if not all([pin_actual, pin_nueva, pin_confirmar]):
        return JsonResponse({"status": "false", "message": "Todos los campos son obligatorios."})

    if pin_nueva != pin_confirmar:
        return JsonResponse({"status": "false", "message": "Los nuevos pin no coinciden."})

    if len(pin_nueva) !=4:
        return JsonResponse({"status": "false", "message": "El nuevo pin debe tener 4 números."})

    # Obtener email del usuario según su RUT
    usuario_ref = database.child(f"Usuario/{rut}").get().val()
    if not usuario_ref:
        return JsonResponse({"status": "false", "message": "Usuario no encontrado."})

    email = usuario_ref.get("correo")


    try:
        pin_usuario_actual=usuario_ref.get("PIN")
        if pin_actual != pin_usuario_actual:
            return JsonResponse({"status": "false", "message": "El pin actual es incorrecto."})
        
        ref= db.reference("/Usuario/"+rut)
        ref.update({
            "PIN":pin_nueva
        })

    except Exception as e:
        return JsonResponse({"status": "false", "message": f"Error al cambiar pin: {e}"})

    return JsonResponse({"status": "success", "message": "Pin actualizado correctamente."})



# def auditoria_view(request):
#     """Vista principal de auditoría"""
    
#     # Obtener parámetros de filtro
#     tipo_accion = request.GET.get('tipo_accion', '')
#     usuario_id = request.GET.get('usuario', '')
#     fecha_inicio = request.GET.get('fecha_inicio', '')
#     fecha_fin = request.GET.get('fecha_fin', '')
    
#     # Query base
#     logs = LogAuditoria.objects.select_related('usuario').all().order_by('-fecha_hora')
    
#     # Aplicar filtros
#     if tipo_accion:
#         logs = logs.filter(tipo_accion=tipo_accion)
    
#     if usuario_id:
#         logs = logs.filter(usuario_id=usuario_id)
    
#     if fecha_inicio:
#         fecha_inicio_dt = datetime.strptime(fecha_inicio, '%Y-%m-%d')
#         logs = logs.filter(fecha_hora__gte=fecha_inicio_dt)
    
#     if fecha_fin:
#         fecha_fin_dt = datetime.strptime(fecha_fin, '%Y-%m-%d')
#         fecha_fin_dt = fecha_fin_dt.replace(hour=23, minute=59, second=59)
#         logs = logs.filter(fecha_hora__lte=fecha_fin_dt)
    
#     # Métricas rápidas
#     total_acciones = LogAuditoria.objects.count()
#     total_descargas = LogAuditoria.objects.filter(tipo_accion='descarga').count()
#     total_cambios_admin = LogAuditoria.objects.filter(tipo_accion='cambio').count()
    
#     hoy = datetime.now().date()
#     usuarios_activos_hoy = LogAuditoria.objects.filter(
#         fecha_hora__date=hoy
#     ).values('usuario').distinct().count()
    
#     # Top usuarios más activos
#     top_usuarios_activos = Usuario.objects.annotate(
#         total_acciones=Count('logauditoria')
#     ).order_by('-total_acciones')[:5]
    
#     # Actividades por tipo
#     actividades_tipo = LogAuditoria.objects.values('tipo_accion').annotate(
#         total=Count('id')
#     ).order_by('-total')
    
#     actividades_por_tipo = [0, 0, 0, 0, 0, 0]  # [descargas, cambios, accesos, creaciones, eliminaciones, actualizaciones]
#     for act in actividades_tipo:
#         if act['tipo_accion'] == 'descarga':
#             actividades_por_tipo[0] = act['total']
#         elif act['tipo_accion'] == 'cambio':
#             actividades_por_tipo[1] = act['total']
#         elif act['tipo_accion'] == 'acceso':
#             actividades_por_tipo[2] = act['total']
#         elif act['tipo_accion'] == 'creacion':
#             actividades_por_tipo[3] = act['total']
#         elif act['tipo_accion'] == 'eliminacion':
#             actividades_por_tipo[4] = act['total']
#         elif act['tipo_accion'] == 'actualizacion':
#             actividades_por_tipo[5] = act['total']
    
#     # Actividades por día (últimos 7 días)
#     fecha_hace_7_dias = datetime.now() - timedelta(days=7)
#     actividades_dias = []
#     labels_dias = []
    
#     for i in range(7):
#         dia = fecha_hace_7_dias + timedelta(days=i)
#         count = LogAuditoria.objects.filter(
#             fecha_hora__date=dia.date()
#         ).count()
#         actividades_dias.append(count)
#         labels_dias.append(dia.strftime('%d/%m'))
    
#     actividades_por_dia = {
#         'labels': labels_dias,
#         'data': actividades_dias
#     }
    
#     # Descargas por documento (top 5)
#     descargas_docs = LogAuditoria.objects.filter(
#         tipo_accion='descarga'
#     ).values('descripcion').annotate(
#         total=Count('id')
#     ).order_by('-total')[:5]
    
#     descargas_por_documento = {
#         'labels': [d['descripcion'][:30] + '...' if len(d['descripcion']) > 30 else d['descripcion'] for d in descargas_docs],
#         'data': [d['total'] for d in descargas_docs]
#     }
    
#     # Paginación
#     paginator = Paginator(logs, 20)  # 20 registros por página
#     page_number = request.GET.get('page')
#     logs_paginados = paginator.get_page(page_number)
    
#     # Lista de usuarios para el filtro
#     usuarios_lista = Usuario.objects.all().order_by('nombre')
    
#     context = {
#         'total_acciones': total_acciones,
#         'total_descargas': total_descargas,
#         'total_cambios_admin': total_cambios_admin,
#         'usuarios_activos_hoy': usuarios_activos_hoy,
#         'top_usuarios_activos': top_usuarios_activos,
#         'actividades_por_tipo': json.dumps(actividades_por_tipo),
#         'actividades_por_dia': json.dumps(actividades_por_dia),
#         'descargas_por_documento': json.dumps(descargas_por_documento),
#         'logs_auditoria': logs_paginados,
#         'usuarios_lista': usuarios_lista,
#         'fecha_inicio': fecha_inicio,
#         'fecha_fin': fecha_fin,
#     }
    
#     return render(request, 'staffweb/auditoria.html', context)


# @login_required
# def auditoria_detalles(request, log_id):
#     """Vista para obtener detalles de un log específico"""
#     try:
#         log = LogAuditoria.objects.select_related('usuario').get(id=log_id)
#         data = {
#             'usuario': log.usuario.nombre,
#             'fecha_hora': log.fecha_hora.strftime('%d/%m/%Y %H:%M:%S'),
#             'tipo_accion': log.get_tipo_accion_display(),
#             'descripcion': log.descripcion,
#             'ip_address': log.ip_address,
#             'user_agent': log.user_agent,
#             'datos_adicionales': log.datos_adicionales if hasattr(log, 'datos_adicionales') else None
#         }
#         return JsonResponse(data)
#     except LogAuditoria.DoesNotExist:
#         return JsonResponse({'error': 'Log no encontrado'}, status=404)