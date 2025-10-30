from django.urls import path
from . import views

urlpatterns = [

    path('test_token/', views.test_token),
    #FUNCIONES API
    path('obtener_solicitudes/', views.obtener_solicitudes),
    path('cancelar_solicitud/<str:id_solicitud>/', views.cancelar_solicitud, name='cancelar_solicitud'),
    path('detalle_solicitud/<str:id_solicitud>/', views.detalle_solicitud, name='detalle_solicitud'),

]
