import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from "@angular/router"
import { AnunciosApi } from 'src/app/services/anuncios-api';

interface Publicacion {
  id: string
  titulo: string
  contenido: string
  tipo: "Noticia" | "Aviso" | null
  fecha_emitida: string
  id_empleador: string
}

@Component({
  selector: 'app-detalleavisos',
  templateUrl: './detalleavisos.page.html',
  styleUrls: ['./detalleavisos.page.scss'],
  standalone: false
})
export class DetalleavisosPage implements OnInit {

  publicacionId: string | null = null;

  publicacion: Publicacion = {
    id: "",
    titulo: "",
    contenido: "",
    tipo: null,
    fecha_emitida: "",
    id_empleador: "",
  }
  
  isLoading = true;
  errorMessage: string | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
      private publicacionesApi: AnunciosApi) {}

  ngOnInit() {
    this.publicacionId = this.route.snapshot.paramMap.get('id');

    if (this.publicacionId) {
      this.cargarDetalle(this.publicacionId);
    } else {
      this.isLoading = false;
      this.errorMessage = "ID de solicitud no encontrado en la ruta.";
      this.publicacion.titulo = "Error";
    }
  }

  
  cargarDetalle(id: string) {
    this.isLoading = true;

    this.publicacionesApi.obtenerDetallePublicacion(id).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.status === 'success' && response.publicacion) {
          
          this.publicacion = {
            ...response.publicacion,
          } as Publicacion;

        } else {
          this.errorMessage = response.message || "No se pudo cargar el detalle de la solicitud.";
          this.publicacion.titulo = "Error de Datos";
        }
      },
      error: (httpError) => {
        this.isLoading = false;
        if (httpError.status === 404) {
            this.errorMessage = "La solicitud no existe o fue eliminada.";
        } else if (httpError.status === 403) {
            this.errorMessage = "Acceso denegado: Esta solicitud no te pertenece.";
        } else {
            this.errorMessage = "Error de conexión con la API.";
        }
        this.publicacion.titulo = "Error de Carga";
      }
    });
  }

  goBack() {
    this.router.navigateByUrl("/tabs/noticias")
  }
}