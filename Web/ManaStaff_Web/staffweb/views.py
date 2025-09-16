from django.shortcuts import render

# Create your views here.

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
    doc_name = request.GET.get("doc", "Documento")
    doc_path = request.GET.get("path", "")
    context = {
        "doc_name": doc_name,
        "doc_path": doc_path,
    }
    return render(request, "staffweb/ver_documentos.html", context)