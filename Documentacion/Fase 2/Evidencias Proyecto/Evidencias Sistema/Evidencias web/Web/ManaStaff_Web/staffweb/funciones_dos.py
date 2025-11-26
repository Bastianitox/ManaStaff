from django.http import JsonResponse
from .firebase import database, db
#-----------------------------------------PIN--------------------------------------------------

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
        usuario_data = db.reference("Usuario").child(rut).get() or {}
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

#-----------------------------------------------------------------------------------------------

# Listar todas las publicaciones
def listar_publicaciones():
    ref = db.reference("Anuncio")
    anuncios = ref.get() or {}
    return anuncios

# Crear nueva publicación
def crear_publicacion_funcion(data):
    ref = db.reference("Anuncio")
    ref.push(data)

# Obtener una publicación por ID
def obtener_publicacion(pub_id):
    ref = db.reference(f"Anuncio/{pub_id}")
    return ref.get()

# Modificar una publicación existente
def modificar_publicacion(pub_id, data):
    ref = db.reference(f"Anuncio/{pub_id}")
    ref.update(data)

# Eliminar una publicación
def eliminar_publicacion_funcion(pub_id):
    ref = db.reference(f"Anuncio/{pub_id}")
    ref.delete()

#--------------------------------------------------------------------------------#
def obtener_datos_usuario(usuario_id):
    datos = db.reference("Usuario").child(usuario_id).get()
    if not datos:
        return {}

    cargo_nombre = ""
    cargo_id = datos.get("Cargo")
    if cargo_id:
        cargo_data = db.reference("Cargo").child(cargo_id).get()
        if cargo_data:
            cargo_nombre = cargo_data.get("Nombre", "")

    return {
        "nombre": datos.get("Nombre", ""),
        "segundo_nombre": datos.get("Segundo_nombre", ""),
        "apellido_paterno": datos.get("ApellidoPaterno", ""),
        "apellido_materno": datos.get("ApellidoMaterno", ""),
        "correo": datos.get("correo", ""),
        "telefono": datos.get("Telefono", ""),
        "direccion": datos.get("Direccion", ""),
        "cargo": cargo_nombre,
        "rol": datos.get("Rol", "Sin rol asignado")
    }

def actualizar_datos_usuario(usuario_id, nuevo_celular, nueva_direccion, imagen_nueva):
    db.reference("Usuario").child(usuario_id).update({
        "Telefono": nuevo_celular,
        "Direccion": nueva_direccion,
        "imagen": imagen_nueva
    })
