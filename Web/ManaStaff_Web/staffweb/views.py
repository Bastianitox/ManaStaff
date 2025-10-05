from datetime import datetime, timedelta
import re, json, uuid, os, re, mimetypes
<<<<<<< Updated upstream

from django.conf import settings
from django.urls import reverse
from django.http import JsonResponse
from django.contrib import messages
from django.shortcuts import render, redirect
from django.views.decorators.http import require_POST

=======
from django.contrib import messages
from django.shortcuts import render, redirect

from django.conf import settings
from django.shortcuts import render
>>>>>>> Stashed changes
from urllib.parse import urlparse, unquote, quote
from collections import Counter, defaultdict

from .funciones_dos import listar_publicaciones, crear_publicacion_funcion, modificar_publicacion, eliminar_publicacion_funcion, obtener_publicacion

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
def _safe_filename(filename: str) -> str:
    base = os.path.basename(filename or "archivo")
    base = re.sub(r"[^A-Za-z0-9_.-]+", "_", base)
    base = base.lstrip(".") or "archivo"
    return base

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

def _tipoestado_codes():
    #Lee Tipoestado
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

def administrar_documentos(request):
    # Usar los helpers comunes
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
    for doc_id, data in documentos_raw.items():
        if not isinstance(data, dict):
            continue

        rut_doc = _normalize_rut(data.get('id_rut') or data.get('Rut') or data.get('rut'))
        if not rut_doc:
            continue

        fecha_str = str(data.get('Fecha_emitida') or data.get('fecha_emitida') or '').strip()
        fecha_show = fecha_str or ""

        tipoestado_code = str(data.get('Tipoestado') or data.get('tipoestado') or '').strip()
        estado = code_to_name.get(tipoestado_code) 

        if not estado:
            estado = 'pendiente' if not data.get('url') else 'activo'

        try:
            f = None
            for fmt in ("%d-%m-%Y", "%Y-%m-%d", "%Y-%m-%d %H:%M:%S",
                        "%Y-%m-%d %H:%M", "%Y-%m-%d %H:%M:%S.%f"):
                try:
                    f = datetime.strptime(fecha_str, fmt)
                    break
                except ValueError:
                    continue
            if f:
                if f < datetime.now() - timedelta(days=550):
                    estado = 'caducado'
                fecha_show = f.strftime("%d/%m/%Y")
        except Exception:
            pass

        # Objeto para el front
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

    # Bloques por usuario
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
    if request.method == "POST":
<<<<<<< Updated upstream
        # Validación y normalización
=======
        #Validación y normalización
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
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

=======
        # Preparar datos base
        ahora_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        id_empleador = _normalize_rut(request.session.get("usuario_rut") or request.session.get("usuario_id") or "1111111111")
        tipo_doc = _ext_to_type(file.name) if file else "PDF"
        tamano_archivo = _size_to_mb_str(file)

        # crear id propio
        doc_id = f"IdDoc_{uuid.uuid4().hex[:10]}"

        # Subir a Storage si hay archivo
        download_url = ""
        if file:
            bucket = storage.bucket()

            # ruta
            safe_name = _safe_filename(file.name)
            blob_name = f"{rut_sel}/Documentos/{doc_id}/{safe_name}"
            blob = bucket.blob(blob_name)

            # content-type y token de descarga pública
>>>>>>> Stashed changes
            content_type = file.content_type or mimetypes.guess_type(safe_name)[0] or "application/octet-stream"
            token = uuid.uuid4().hex
            blob.metadata = {"firebaseStorageDownloadTokens": token}

<<<<<<< Updated upstream
            blob.upload_from_file(file, content_type=content_type)

            quoted = quote(blob_name, safe="")
            download_url   = f"https://firebasestorage.googleapis.com/v0/b/{bucket.name}/o/{quoted}?alt=media&token={token}"
            storage_path   = blob_name     
            storage_bucket = bucket.name        

        # Guardar en realtime 
        data = {
            "Fecha_emitida": ahora_str,
            "Tipoestado": tipoestado_code,
=======
            # subir el archivo
            blob.upload_from_file(file, content_type=content_type)

            # URL pública con token
            quoted = quote(blob_name, safe="")
            download_url = f"https://firebasestorage.googleapis.com/v0/b/{bucket.name}/o/{quoted}?alt=media&token={token}"

        # Guardar en Realtime
        data = {
            "Fecha_emitida": ahora_str,
            "Tipoestado": tipoestado_code, 
>>>>>>> Stashed changes
            "id_empleador": id_empleador,
            "id_rut": rut_sel,
            "nombre": nombre_doc,
            "tamano_archivo": tamano_archivo,
            "tipo_documento": tipo_doc,
<<<<<<< Updated upstream
            "url": download_url,
            "storage_path": storage_path,   
            "storage_bucket": storage_bucket
=======
            "url": download_url,            
>>>>>>> Stashed changes
        }
        if fecha_venc:
            data["fecha_vencimiento"] = fecha_venc

        try:
            db.reference("Documentos").child(doc_id).set(data)
            messages.success(request, "Documento creado correctamente.")
        except Exception:
            messages.error(request, "Hubo un problema guardando el documento.")

        return redirect("administrar_documentos")

<<<<<<< Updated upstream
    # GET 
=======
    # ============== GET ==============
    # Usuarios para el buscador
>>>>>>> Stashed changes
    usuarios_raw = database.child("Usuario").get().val() or {}
    usuarios_lista = []
    if isinstance(usuarios_raw, dict):
        for rut, u in usuarios_raw.items():
<<<<<<< Updated upstream
            if not isinstance(u, dict):
=======
            if not isinstance(u, dict): 
>>>>>>> Stashed changes
                continue
            nombre = f"{(u.get('Nombre') or '').strip()} {(u.get('ApellidoPaterno') or '').strip()}".strip() or rut
            usuarios_lista.append({
                "rut": str(rut),
<<<<<<< Updated upstream
                "rut_visible": str(rut),
                "nombre": nombre
            })

=======
                "rut_visible": str(rut), 
                "nombre": nombre
            })

    # Mapa de estados
>>>>>>> Stashed changes
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

def documentos_usuarios(request):
    name_to_code, code_to_name = _tipoestado_codes()

    rut_qs = request.GET.get('rut', '')
    rut_norm = _normalize_rut(rut_qs)

    # Usuario
    usuario = {}
    try:
        user_raw = database.child("Usuario").child(rut_norm).get().val()
        if not isinstance(user_raw, dict):
            user_raw = None
        if not user_raw:
            todos_users = database.child("Usuario").get().val() or {}
            if isinstance(todos_users, dict):
                user_raw = todos_users.get(rut_norm)
        if isinstance(user_raw, dict):
            nombre = f"{(user_raw.get('Nombre') or '').strip()} {(user_raw.get('ApellidoPaterno') or '').strip()}".strip()
            usuario = {
                "nombre": nombre or "Usuario",
                "rut": rut_norm,
                "rut_visible": rut_norm,
                "imagen": user_raw.get("imagen") or "",
            }
        else:
            usuario = {"nombre": "Usuario", "rut": rut_norm, "rut_visible": rut_norm}
    except Exception:
        usuario = {"nombre": "Usuario", "rut": rut_norm, "rut_visible": rut_norm}

<<<<<<< Updated upstream
    # Documentos del RUT 
    def calcular_estado_y_fecha(fecha_emitida_str, url, tipoestado_code):
        estado = code_to_name.get(str(tipoestado_code or '').strip())
=======
    # --- Documentos del RUT ---
    def calcular_estado_y_fecha(fecha_emitida_str, url, tipoestado_code):
        estado = code_to_name.get(str(tipoestado_code or '').strip())

>>>>>>> Stashed changes
        if not estado:
            estado = 'pendiente' if not url else 'activo'

        fecha_show = fecha_emitida_str or ""
        #caducado por antigüedad
        try:
            f = None
            for fmt in ("%d-%m-%Y", "%Y-%m-%d", "%d/%m/%Y",
                        "%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M",
                        "%Y-%m-%d %H:%M:%S.%f"):
                try:
                    f = datetime.strptime(str(fecha_emitida_str).strip(), fmt)
                    break
                except ValueError:
                    continue
            if f:
                if f < datetime.now() - timedelta(days=550):
                    estado = 'caducado'
                fecha_show = f.strftime("%d/%m/%Y")
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

        # Filtrar por dueño
        rut_doc = _normalize_rut(data.get('id_rut') or data.get('Rut') or data.get('rut'))
        if rut_doc != rut_norm:
            continue

        estado, fecha_show = calcular_estado_y_fecha(
            data.get('Fecha_emitida') or data.get('fecha_emitida'),
            data.get('url'),
            data.get('Tipoestado') or data.get('tipoestado')
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

def editar_noticiasyeventos(request):
    return render(request, "staffweb/editar_noticiasyeventos.html")

def crear_publicacion(request):
    return render(request, "staffweb/crear_publicacion.html")

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

    return render(request, "staffweb/editar_noticiasyeventos.html")

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

    return render(request, "staffweb/editar_noticiasyeventos.html", {
        "publicacion": publicacion,
        "pub_id": pub_id
    })

# Eliminar
def eliminar_publicacion(request, pub_id):
    eliminar_publicacion_funcion(pub_id)
    return redirect("administrar_noticiasyeventos")