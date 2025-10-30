from django.urls import path
from . import views

urlpatterns = [
    path('solicitudes/', views.obtener_solicitudes),
    path('solicitud/crear/', views.crear_solicitud),
    path('usuario/<str:rut>/editar/', views.actualizar_usuario),
    path('upload/', views.subir_imagen),
    path('perfil/', views.perfil),
    path('test_token/', views.test_token),
]
