import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router"
import { AnunciosApi } from 'src/app/services/anuncios-api';

interface Publicacion {
  id: string
  titulo: string
  resumen: string
  contenido: string
  tipo: "Noticia" | "Aviso"
  fecha_emitida: string
  id_empleador: string
  tipo_anuncio_nombre: string
  tipo_anuncio_id: string
}

@Component({
  selector: 'app-inicioavisos',
  templateUrl: './inicioavisos.page.html',
  styleUrls: ['./inicioavisos.page.scss'],
  standalone: false
})
export class InicioavisosPage implements OnInit {
  publicaciones: Publicacion[] = []
  filteredPublicaciones: Publicacion[] = []
  searchQuery = ""
  isLoading = false

  private initialLoadCompleted = false;

  filters = {
    tipo: "todas" as "todas" | "Noticia" | "Aviso",
    sort: "desc" as "asc" | "desc",
  }

  showFilterModal = false

  constructor(private router: Router,
    private anunciosApi: AnunciosApi
  ) {}

  ngOnInit() {
    this.cargarPublicaciones();
      this.initialLoadCompleted = true; 
  }

  ionViewWillEnter() {
    if (this.initialLoadCompleted && this.publicaciones.length === 0) {
    this.cargarPublicaciones();
    }
  }

  cargarPublicaciones(refresher?: any) {
    this.isLoading = true;
    
    this.anunciosApi.obtenerPublicaciones().subscribe({
      next: (response) => {
        this.isLoading = false;
        
        if (response.status === 'success') {

          this.publicaciones = response.anuncios as Publicacion[]; 
          
          this.applyFilters();

        } else {
          //this.showError(response.message || "Error al obtener la lista de solicitudes.");
          this.publicaciones = [];
        }
        
        if (refresher) {
          refresher.target.complete();
        }
      },
      error: (httpError) => {
        // Manejar errores HTTP (e.g., 401 Unauthorized, 500 Server Error)
        this.isLoading = false;
        
        let message = "Error de conexión con el servidor.";
        if (httpError.status === 401) {
          message = "Su sesión ha expirado o no está autorizado. Inicie sesión nuevamente.";
        } else if (httpError.error && httpError.error.error) {
            message = httpError.error.error;
        }
        
        //this.showError(message);
        this.publicaciones = [];

        if (refresher) {
          refresher.target.complete();
        }
      }
    });
  }
  

  onSearch(event: any) {
    this.searchQuery = event.target.value || ""
    this.applyFilters()
  }

  openFilterModal() {
    this.showFilterModal = true
  }

  closeFilterModal() {
    this.showFilterModal = false
  }

  applyFilters() {
    let filtered = [...this.publicaciones]

    // Filtrar por texto de búsqueda
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase()
      filtered = filtered.filter(
        (pub) => pub.titulo.toLowerCase().includes(query) || pub.resumen.toLowerCase().includes(query),
      )
    }

    // Filtrar por tipo
    if (this.filters.tipo !== "todas") {
      filtered = filtered.filter((pub) => pub.tipo === this.filters.tipo)
    }

    // Ordenar por fecha
    filtered.sort((a, b) => {
      const dateA = new Date(a.fecha_emitida).getTime()
      const dateB = new Date(b.fecha_emitida).getTime()
      return this.filters.sort === "desc" ? dateB - dateA : dateA - dateB
    })

    this.filteredPublicaciones = filtered
    this.closeFilterModal()
  }

  clearFilters() {
    this.filters.tipo = "todas"
    this.filters.sort = "desc"
    this.searchQuery = ""
    this.applyFilters()
  }

  viewDetails(id: string) {
    this.router.navigateByUrl(`/tabs/noticias/detalle/`);
    //console.log("Ver detalles de publicación:", id)
  }
}