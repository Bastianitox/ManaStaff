from django.urls import path
from . import views

app_name = 'api' 

urlpatterns = [

    path('test_token/', views.test_token),
    #FUNCIONES API

    #SOLICITUDES
    path('obtener_solicitudes/', views.obtener_solicitudes, name='obtener_solicitudes'),
    path('cancelar_solicitud/<str:id_solicitud>/', views.cancelar_solicitud, name='cancelar_solicitud'),
    path('detalle_solicitud/<str:id_solicitud>/', views.detalle_solicitud, name='detalle_solicitud'),
    path('crear_solicitud/', views.crear_solicitud, name='crear_solicitud'),
    path('obtener_tipos_solicitud/', views.obtener_tipos_solicitud, name='obtener_tipos_solicitud'),

    #ANUNCIOS
    path('obtener_publicacion/', views.obtener_publicacion, name='obtener_publicacion'),
    path('detalle_publicacion/<str:id_anuncio>/', views.detalle_publicacion, name='detalle_publicacion'),

]
