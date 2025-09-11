from django.urls import path
from .views import index

urlpatterns = [

    # PAGINAS
    path('index',index,name="index"),

]