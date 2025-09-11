from django.urls import path
from .views import crear_solicitud,inicio_dashboard,index, recuperar_contrasena,inicio_perfil, inicio_noticias_eventos,inicio_solicitudes,inicio_documentos

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

]