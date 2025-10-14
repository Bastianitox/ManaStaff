from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from .views import auditoria, cambiar_pin_funcion, perfil,cambiar_contrasena_funcion, modificar_documento, eliminar_documento, eliminar_publicacion,editar_publicacion,crear_publicacion, editar_noticiasyeventos, documentos_usuarios, crear_documento, administrar_noticiasyeventos,administrar_logs,modificar_usuario,crear_usuario,cambiar_pin,administrar_usuarios,administrar_solicitudes,cambiar_contrasena,administrar_documentos,panel_administrar,ver_documentos, crear_solicitud,inicio_dashboard,index, recuperar_contrasena,inicio_perfil, inicio_noticias_eventos,inicio_solicitudes,inicio_documentos
from .funciones import  descargar_documento,recuperar_contrasena_funcion,cerrar_solicitud,asignarme_solicitud,obtener_solicitudes_administrar,obtener_usuario_actual,cancelar_solicitud_funcion,crear_solicitud_funcion,obtener_solicitudes_usuario,modificar_usuario_funcion,obtener_usuario,eliminar_usuario,crear_usuario_funcion,iniciarSesion, cerrarSesion, obtener_usuarios
from .funciones_dos import  verificar_contrasena_actual,actualizar_contrasena,eliminar_publicacion_funcion, modificar_publicacion, obtener_publicacion, crear_publicacion_funcion, validar_pin, funcion_dos
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
    path('crear_documento',crear_documento,name="crear_documento"),
    path('modificar_documento/<str:doc_id>', modificar_documento, name='modificar_documento'),
    path('auditoria', auditoria, name='auditoria'),

    #ADMINISTRAR PAGINAS
    path('panel_administrar',panel_administrar,name="panel_administrar"),
    path('administrar_documentos',administrar_documentos,name="administrar_documentos"),
    path('administrar_solicitudes',administrar_solicitudes,name="administrar_solicitudes"),
    path('administrar_usuarios',administrar_usuarios,name="administrar_usuarios"),
    path('crear_usuario',crear_usuario,name="crear_usuario"),
    path('modificar_usuario',modificar_usuario,name="modificar_usuario"),
    path('administrar_logs',administrar_logs,name="administrar_logs"),
    path('administrar_noticiasyeventos',administrar_noticiasyeventos,name="administrar_noticiasyeventos"),
    path('documentos_usuarios',documentos_usuarios,name="documentos_usuarios"),
    path('editar_noticiasyeventos',editar_noticiasyeventos,name="editar_noticiasyeventos"),
    path('crear_publicacion',crear_publicacion,name="crear_publicacion"),
    path('eliminar_documento', eliminar_documento, name='eliminar_documento'),

    #FUNCIONES
    path('iniciarSesion',iniciarSesion,name="iniciarSesion"),
    path('cerrarSesion',cerrarSesion,name="cerrarSesion"),
    path('obtener_usuarios',obtener_usuarios,name="obtener_usuarios"),
    path('crear_usuario_funcion',crear_usuario_funcion,name="crear_usuario_funcion"),
    path('eliminar_usuario/<str:rut>',eliminar_usuario,name="eliminar_usuario"),
    path('obtener_usuario',obtener_usuario,name="obtener_usuario"),
    path('modificar_usuario_funcion/<str:rut>',modificar_usuario_funcion,name="modificar_usuario_funcion"),
    path('obtener_solicitudes_usuario',obtener_solicitudes_usuario,name="obtener_solicitudes_usuario"),
    path('crear_solicitud_funcion',crear_solicitud_funcion,name="crear_solicitud_funcion"),
    path('cancelar_solicitud_funcion/<str:id_solicitud>',cancelar_solicitud_funcion,name="cancelar_solicitud_funcion"),
    path('obtener_usuario_actual',obtener_usuario_actual,name="obtener_usuario_actual"),
    path('obtener_solicitudes_administrar',obtener_solicitudes_administrar,name="obtener_solicitudes_administrar"),
    path('asignarme_solicitud/<str:id_solicitud>',asignarme_solicitud,name="asignarme_solicitud"),
    path('cerrar_solicitud/<str:id_solicitud>/<str:estado>',cerrar_solicitud,name="cerrar_solicitud"),
    path('recuperar_contrasena_funcion',recuperar_contrasena_funcion,name="recuperar_contrasena_funcion"),
    path('descargar_documento/<str:doc_id>',descargar_documento,name="descargar_documento"),
    path('cambiar_contrasena_funcion/<str:rut>',cambiar_contrasena_funcion,name="cambiar_contrasena_funcion"),
    path('editar_publicacion/<str:pub_id>',editar_publicacion,name="editar_publicacion"),
    path('eliminar_publicacion/<str:pub_id>',eliminar_publicacion,name="eliminar_publicacion"), 
    path('perfil',perfil,name="perfil"), 
    path('cambiar_pin_funcion/<str:rut>',cambiar_pin_funcion,name="cambiar_pin_funcion"),


    #FUNCIONES 2
        #PIN
    path('validar_pin', validar_pin, name='validar_pin'),
        #Publicaciones
    path('crear_publicacion_funcion/<str:doc_id>',crear_publicacion_funcion,name="crear_publicacion_funcion"),
    path('obtener_publicacion/<str:doc_id>',obtener_publicacion,name="obtener_publicacion"),
    path('modificar_publicacion/<str:doc_id>',modificar_publicacion,name="modificar_publicacion"),
    path('eliminar_publicacion_funcion/<str:doc_id>',eliminar_publicacion_funcion,name="eliminar_publicacion_funcion"),
    path('actualizar_contrasena/<str:doc_id>',actualizar_contrasena,name="actualizar_contrasena"),
    path('verificar_contrasena_actual/<str:doc_id>',verificar_contrasena_actual,name="verificar_contrasena_actual"),

]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

handler403 = "staffweb.views.error_403"