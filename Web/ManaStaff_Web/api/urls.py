from django.urls import path
from . import views

app_name = 'api' 

urlpatterns = [

    #SOLICITUDES
    path('obtener_solicitudes/', views.obtener_solicitudes, name='obtener_solicitudes'),
    path('cancelar_solicitud/<str:id_solicitud>/', views.cancelar_solicitud, name='cancelar_solicitud'),
    path('detalle_solicitud/<str:id_solicitud>/', views.detalle_solicitud, name='detalle_solicitud'),
    path('crear_solicitud/', views.crear_solicitud, name='crear_solicitud'),
    path('obtener_tipos_solicitud/', views.obtener_tipos_solicitud, name='obtener_tipos_solicitud'),

    #ANUNCIOS
    path('obtener_publicacion/', views.obtener_publicacion, name='obtener_publicacion'),
    path('detalle_publicacion/<str:id_anuncio>/', views.detalle_publicacion, name='detalle_publicacion'),

    #DOCUMENTOS
    path('obtener_documentos/', views.obtener_documentos, name='obtener_documentos'),
    path('descargar_documento/<str:id_doc>/', views.descargar_documento, name='descargar_documento'),
    path('verificar_pin/', views.verificar_pin, name='verificar_pin'),

    #USUARIO
    path('actualizar_perfil/', views.actualizar_perfil, name='actualizar_perfil'),

]
