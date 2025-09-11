from django.urls import path
from .views import index

urlpatterns = [

    # PAGINAS
    path('index',index,name="index"),
    path('recuperar_contrasena',recuperar_contrasena,name="recuperar_contrasena")

]