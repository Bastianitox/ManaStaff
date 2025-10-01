from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from .views import administrar_noticiasyeventos,administrar_logs,modificar_usuario,crear_usuario,cambiar_pin,administrar_usuarios,administrar_solicitudes,cambiar_contrasena,administrar_documentos,panel_administrar,ver_documentos, crear_solicitud,inicio_dashboard,index, recuperar_contrasena,inicio_perfil, inicio_noticias_eventos,inicio_solicitudes,inicio_documentos
from .funciones import obtener_usuario,eliminar_usuario,crear_usuario_funcion,iniciarSesion, cerrarSesion, ejemplo_crear, ejemplo_modificar, ejemplo_eliminar, obtener_usuarios
from .funciones_dos import funcion_dos
from .funciones_tres import funcion_tres

urlpatterns = [

    # PAGINAS
    path('',index,name="index"),
    path('recuperar_contrasena',recuperar_contrasena,name="recuperar_contrasena"),
    path('inicio_solicitudes',inicio_solicitudes,name="inicio_solicitudes"),
    path('inicio_documentos',inicio_documentos,name="inicio_documentos"),
    path('inicio_perfil',inicio_perfil,name="inicio_perfil"),
    path('inicio_noticias_eventos',inicio_noticias_eventos,name="inicio_noticias_eventos"),
    path('inicio_dashboard',inicio_dashboard,name="inicio_dashboard"),
    path('crear_solicitud',crear_solicitud,name="crear_solicitud"),
    path('ver_documentos',ver_documentos,name="ver_documentos"),
    path('cambiar_contrasena',cambiar_contrasena,name="cambiar_contrasena"),
    path('cambiar_pin',cambiar_pin,name="cambiar_pin"),
    
    #ADMINISTRAR PAGINAS
    path('panel_administrar',panel_administrar,name="panel_administrar"),
    path('administrar_documentos',administrar_documentos,name="administrar_documentos"),
    path('administrar_solicitudes',administrar_solicitudes,name="administrar_solicitudes"),
    path('administrar_usuarios',administrar_usuarios,name="administrar_usuarios"),
    path('crear_usuario',crear_usuario,name="crear_usuario"),
    path('modificar_usuario',modificar_usuario,name="modificar_usuario"),
    path('administrar_logs',administrar_logs,name="administrar_logs"),
    path('administrar_noticiasyeventos',administrar_noticiasyeventos,name="administrar_noticiasyeventos"),

    #FUNCIONES
    path('iniciarSesion',iniciarSesion,name="iniciarSesion"),
    path('cerrarSesion',cerrarSesion,name="cerrarSesion"),
    path('obtener_usuarios',obtener_usuarios,name="obtener_usuarios"),
    path('crear_usuario_funcion',crear_usuario_funcion,name="crear_usuario_funcion"),
    path('eliminar_usuario/<str:rut>',eliminar_usuario,name="eliminar_usuario"),
    path('obtener_usuario',obtener_usuario,name="obtener_usuario"),

    #EJEMPLOS
    path('ejemplo_crear',ejemplo_crear,name="ejemplo_crear"),
    path('ejemplo_modificar',ejemplo_modificar,name="ejemplo_modificar"),
    path('ejemplo_eliminar',ejemplo_eliminar,name="ejemplo_eliminar"),
    

]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)