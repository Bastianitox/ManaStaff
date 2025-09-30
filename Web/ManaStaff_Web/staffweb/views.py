from django.shortcuts import render

import os
from django.conf import settings
from django.shortcuts import render

#IMPORTS DE FIREBASE
from firebase_admin import auth
from .firebase import firebase, db, storage


# VARIABLES FIREBASE
database = firebase.database()
authP = firebase.auth()

def index(request):
    return render(request, 'staffweb/index.html')

def recuperar_contrasena(request):
    return render(request, 'staffweb/recuperar_contrasena.html')

def inicio_solicitudes(request):
    return render(request, 'staffweb/inicio_solicitudes.html')

def inicio_documentos(request):
    
    return render(request, 'staffweb/inicio_documentos.html')
    
def inicio_perfil(request):
    return render(request, 'staffweb/inicio_perfil.html')
    
def inicio_noticias_eventos(request):
    return render(request, 'staffweb/inicio_noticias_eventos.html')
    
def inicio_dashboard(request):
    return render(request, 'staffweb/inicio_dashboard.html')
    
def crear_solicitud(request):
    return render(request, 'staffweb/crear_solicitud.html')

def ver_documentos(request):
    return render(request, "staffweb/ver_documentos.html")

def cambiar_contrasena(request):
    return render(request, "staffweb/cambiar_contrasena.html")

def cambiar_pin(request):
    return render(request, "staffweb/cambiar_pin.html")

#ADMINISTRACION
def panel_administrar(request):
    return render(request, "staffweb/panel_administrar.html")

def administrar_usuarios(request):
    return render(request, "staffweb/administrar_usuarios.html")

def crear_usuario(request):
    return render(request, "staffweb/crear_usuario.html")

def modificar_usuario(request):
    return render(request, "staffweb/modificar_usuario.html")
    
def administrar_solicitudes(request):
    return render(request, "staffweb/administrar_solicitudes.html")
    
def administrar_documentos(request):
    return render(request, "staffweb/administrar_documentos.html")