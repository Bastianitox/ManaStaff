from django.urls import path
from .views import index, recuperar_contrasena, inicio_solicitudes

urlpatterns = [

    # PAGINAS
    path('',index,name="index"),
    path('recuperar_contrasena',recuperar_contrasena,name="recuperar_contrasena")
    path('inicio_solicitudes',inicio_solicitudes,name="inicio_solicitudes")

]