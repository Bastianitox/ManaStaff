from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .firebase_utils import get_data, set_data, update_data, delete_data, upload_file

from django.http import JsonResponse
from staffweb.firebase import auth, db
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import json

#----------------------------------- SOLICITUDES -----------------------------------
@csrf_exempt
def obtener_solicitudes(request):

    if request.method != "GET":
        return JsonResponse({"error": "Método no permitido"}, status=405)

    # 🔐 Leer header de autorización
    auth_header = request.headers.get("Authorization")

    if not auth_header:
        return JsonResponse({"error": "Token faltante"}, status=401)

    # Limpiar token si viene con "Bearer "
    if auth_header.startswith("Bearer "):
        id_token = auth_header.split("Bearer ")[1]
    else:
        id_token = auth_header

    # 🔍 Verificar token Firebase
    try:
        decoded = auth.verify_id_token(id_token)
        uid = decoded.get("uid")
    except Exception as e:
        return JsonResponse({"error": f"Token inválido o expirado: {str(e)}"}, status=401)

    # 🔎 Consultar en Firebase Realtime Database
    try:
        ref = db.reference("Solicitudes").get() or {}
    except Exception as e:
        return JsonResponse({"error": "Error al acceder a Firebase"}, status=500)

    # 🔄 Convertir a lista
    tipo_solicitud = db.reference("TiposSolicitud").get() or {}
    solicitudes_list = []
    for key, value in ref.items():

        tipo_nombre = "Sin tipo"
        for key_tipo, value_tipo in tipo_solicitud.items():
            if key_tipo == value.get("tipo_solicitud"):
                tipo_nombre = value_tipo.get("nombre")
                break

        solicitudes_list.append({
            "id": key,
            "asunto": value.get("Asunto"),
            "descripcion": value.get("Descripcion"),
            "estado": value.get("Estado"),
            "fecha_solicitud": value.get("Fecha_solicitud"),
            "fecha_inicio": value.get("Fecha_inicio"),
            "fecha_fin": value.get("Fecha_fin"),
            "tipo_solicitud_nombre": tipo_nombre
        })

    return JsonResponse({"solicitudes": solicitudes_list})




#----------------------------------- ANUNCIOS -----------------------------------



#----------------------------------- USUARIOS / PERFIL -----------------------------------




#----------------------------------- DOCUMENTOS -----------------------------------







@csrf_exempt
def test_token(request):
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return JsonResponse({"error": "Token faltante"}, status=401)

    token = auth_header.split("Bearer ")[1] if auth_header.startswith("Bearer ") else auth_header
    try:
        decoded = auth.verify_id_token(token)
        return JsonResponse({"uid": decoded["uid"], "email": decoded.get("email")})
    except Exception as e:
        return JsonResponse({"error": f"Token inválido: {str(e)}"}, status=401)


# === EJEMPLO 1: Lectura general ===
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def listar_solicitudes(request):
    data = get_data('Solicitudes')  # nodo Firebase
    return Response(data or {}, status=status.HTTP_200_OK)


# === EJEMPLO 2: Creación ===
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def crear_solicitud(request):
    solicitud = request.data
    ref_path = f"Solicitudes/{solicitud.get('id')}"
    set_data(ref_path, solicitud)
    return Response({"message": "Solicitud creada", "path": ref_path}, status=status.HTTP_201_CREATED)


# === EJEMPLO 3: Actualización ===
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def actualizar_usuario(request, rut):
    """Solo el usuario dueño o admin puede modificar."""
    user_claims = request.user
    uid = user_claims.get('uid')
    is_admin = user_claims.get('admin', False)

    nodo_usuario = get_data(f'Usuario/{rut}')
    if not nodo_usuario:
        return Response({"error": "Usuario no encontrado"}, status=404)

    if not is_admin and nodo_usuario.get('uid') != uid:
        return Response({"error": "No autorizado"}, status=403)

    campos_permitidos = ['Direccion', 'Telefono', 'PIN']
    update = {k: v for k, v in request.data.items() if k in campos_permitidos or is_admin}
    update_data(f'Usuario/{rut}', update)
    return Response({"message": "Actualizado", "data": update})


# === EJEMPLO 4: Subir archivo a Storage ===
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def subir_imagen(request):
    file = request.FILES.get('file')
    if not file:
        return Response({"error": "No se envió archivo"}, status=400)

    path = f"uploads/{file.name}"
    res = upload_file(file, path)
    return Response(res, status=200)


# === EJEMPLO 5: Perfil del usuario (Auth) ===
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def perfil(request):
    uid = request.user.get('uid')
    user = auth.get_user(uid)
    return Response({
        "uid": user.uid,
        "email": user.email,
        "display_name": user.display_name,
        "custom_claims": user.custom_claims or {}
    })
