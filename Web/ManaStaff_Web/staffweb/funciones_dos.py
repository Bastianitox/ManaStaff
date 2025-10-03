import re
from django.shortcuts import render, redirect
from django.views.decorators.http import require_POST,require_GET
from requests.exceptions import HTTPError
from datetime import datetime, timedelta
from django.http import JsonResponse

from .firebase import authP, auth, database, storage, db

def funcion_dos(request):
    pass


# def crear_publicacion(id_publicacion, data):
#     """ Crea una nueva publicación en Firebase """
#     database.child("NoticiasAvisos").child(id_publicacion).set({
#         "titulo": data.get("titulo"),
#         "fecha": datetime.now().strftime("%Y-%m-%d"),
#         "autor": data.get("autor", "Administración"),
#         "contenido": data.get("contenido"),
#         "tipo": data.get("tipo", "noticia")  # noticia o aviso
#     })

# def editar_publicacion(id_publicacion, data):
#     """ Edita una publicación existente """
#     database.child("NoticiasAvisos").child(id_publicacion).update({
#         "titulo": data.get("titulo"),
#         "contenido": data.get("contenido"),
#         "tipo": data.get("tipo", "noticia")
#     })

# def eliminar_publicacion(id_publicacion):
#     """ Elimina una publicación """
#     database.child("NoticiasAvisos").child(id_publicacion).remove()

# def get_publicaciones():
#     """ Obtiene todas las publicaciones """
#     publicaciones = database.child("NoticiasAvisos").get().val()
#     return publicaciones or {}