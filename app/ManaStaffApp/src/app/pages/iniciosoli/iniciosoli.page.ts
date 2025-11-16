import { Component, type OnInit } from "@angular/core"
import { Router } from '@angular/router'
import { filter, take } from "rxjs"
import { AuthService } from "src/app/services/auth-service"
import { SolicitudesApiService } from "src/app/services/solicitudes-api"

interface Solicitud {
  id: string
  asunto: string
  descripcion: string
  estado: "pendiente" | "aprobada" | "rechazada"
  fecha_solicitud: string
  fecha_inicio: string | null
  fecha_fin: string | null
  fecha_vista: string | null
  tipo_solicitud_id: string
  tipo_solicitud_nombre: string
}

@Component({
  selector: "app-iniciosoli",
  templateUrl: "./iniciosoli.page.html",
  styleUrls: ["./iniciosoli.page.scss"],
  standalone: false
})
export class IniciosoliPage implements OnInit {
  solicitudes: Solicitud[] = []
  filteredSolicitudes: Solicitud[] = []
  searchQuery = ""
  isLoading = false

  filters = {
    estados: {
      pendiente: false,
      aprobada: false,
      rechazada: false,
    },
    tipo: {} as { [tipoId: string]: boolean },
    sort: "desc" as "asc" | "desc",
  }

  tipoOptions: { id: string; nombre: string }[] = []

  showFilterModal = false
  showCancelModal = false
  selectedRequestId: string | null = null

  showToast = false
  toastMessage = ""
  toastType: "success" | "error" | null = null

  private initialLoadCompleted = false;

  constructor(
    private router: Router,
    private solicitudesApi: SolicitudesApiService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.authService.idToken$.pipe(
      filter(token => !!token),
      take(1)                  
    ).subscribe(() => {
      this.cargarSolicitudes();
      this.initialLoadCompleted = true; 
    });
  }

  ionViewWillEnter() {
    if (this.initialLoadCompleted && this.solicitudes.length === 0) {
      this.cargarSolicitudes();
    }
  }

  cargarSolicitudes(refresher?: any) {
    this.isLoading = true;
    
    this.solicitudesApi.obtenerSolicitudes().subscribe({
      next: (response) => {
        this.isLoading = false;
        
        if (response.status === 'success') {
          this.solicitudes = response.solicitudes as Solicitud[]; 
          
          this.inicializarTipos();
          
          this.applyFilters();

        } else {
          this.showError(response.message || "Error al obtener la lista de solicitudes.");
          this.solicitudes = [];
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
        
        this.showError(message);
        this.solicitudes = [];

        if (refresher) {
          refresher.target.complete();
        }
      }
    });
  }

  private inicializarTipos() {
    const tiposMap = new Map<string, string>();
    this.solicitudes.forEach((sol) => {
      tiposMap.set(sol.tipo_solicitud_id, sol.tipo_solicitud_nombre);
    });

    this.tipoOptions = Array.from(tiposMap.entries()).map(([id, nombre]) => ({
      id,
      nombre,
    }));

    // Inicializar filtros de tipo
    this.tipoOptions.forEach((tipo) => {
      this.filters.tipo[tipo.id] = false;
    });
  }

  formatSolicitudDate(dateString: string | null): string | null {
    if (!dateString || dateString.toLowerCase() === 'null') {
      return null;
    }
    // Reemplaza el espacio por 'T' para asegurar compatibilidad ISO 8601
    const date = new Date(dateString.replace(' ', 'T')); 
    
    // Formato día/mes/año
    return new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
  }

  handleRefresh(event: any) {
    this.cargarSolicitudes(event);
  }

  createNewRequest() {
    this.router.navigate(["/tabs/solicitudes/crear"])
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
    this.applyFilters()
  }

  applyFilters() {
    let filtered = [...this.solicitudes]

    // Filtrar por texto de búsqueda
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase()
      filtered = filtered.filter(
        (sol) =>
          sol.asunto.toLowerCase().includes(query) ||
          sol.descripcion.toLowerCase().includes(query) ||
          sol.tipo_solicitud_nombre.toLowerCase().includes(query),
      )
    }

    // Filtrar por estado del modal
    const estadosSeleccionados = Object.entries(this.filters.estados)
      .filter(([_, checked]) => checked)
      .map(([estado, _]) => estado)

    if (estadosSeleccionados.length > 0) {
      filtered = filtered.filter((sol) => estadosSeleccionados.includes(sol.estado))
    }

    // Filtrar por tipo de solicitud
    const tiposSeleccionados = Object.entries(this.filters.tipo)
      .filter(([_, checked]) => checked)
      .map(([tipoId, _]) => tipoId)

    if (tiposSeleccionados.length > 0) {
      filtered = filtered.filter((sol) => tiposSeleccionados.includes(sol.tipo_solicitud_id))
    }

    // Ordenar por fecha
    filtered.sort((a, b) => {
      const dateA = new Date(a.fecha_solicitud).getTime()
      const dateB = new Date(b.fecha_solicitud).getTime()
      return this.filters.sort === "desc" ? dateB - dateA : dateA - dateB
    })

    this.filteredSolicitudes = filtered
  }

  clearFilters() {
    this.filters.estados = {
      pendiente: false,
      aprobada: false,
      rechazada: false,
    }

    this.tipoOptions.forEach((tipo) => {
      this.filters.tipo[tipo.id] = false
    })

    this.filters.sort = "desc"
    this.searchQuery = ""

    this.applyFilters()
  }

  getDateRange(solicitud: Solicitud): string {
    // Manejar la posibilidad de que la API devuelva la cadena "null"
    const inicio = this.formatSolicitudDate(solicitud.fecha_inicio);
    const fin = this.formatSolicitudDate(solicitud.fecha_fin);

    if (inicio && !fin) {
      return `${inicio} - Decisión pendiente`;
    }

    if (inicio && fin) {
      if (inicio === fin) {
        return inicio; // Si son el mismo día, muestra solo una vez
      }
      return `${inicio} - ${fin}`;
    }

    return "En revisión"; // Si ambas fechas son nulas
  }

  cancelRequest(id: string) {
    this.selectedRequestId = id
    this.showCancelModal = true
  }

  closeCancelModal() {
    this.showCancelModal = false
    this.selectedRequestId = null
  }

  confirmCancel() {
    if (!this.selectedRequestId) {
        this.showError("Error: No se ha seleccionado una solicitud para cancelar.");
        this.closeCancelModal();
        return;
    }

    const id_solicitud = this.selectedRequestId;
    this.isLoading = true; // Mostrar spinner al iniciar la cancelación
    this.closeCancelModal(); // Cerrar el modal de confirmación

    this.solicitudesApi.cancelarSolicitud(id_solicitud).subscribe({
        next: (response) => {
            this.isLoading = false;
            if (response.status === 'success') {
                this.showSuccess(response.message || "Solicitud cancelada correctamente.");
                this.cargarSolicitudes(); 
            } else {
                this.showError(response.message || "No se pudo cancelar la solicitud.");
            }
        },
        error: (httpError) => {
            this.isLoading = false;
            let message = "Error de conexión con el servidor al cancelar.";
            if (httpError.status === 403) {
                message = "No autorizado para cancelar esta solicitud o ya ha sido resuelta.";
            } else if (httpError.error && httpError.error.message) {
                message = httpError.error.message;
            } else if (httpError.statusText) {
                message = `Error ${httpError.status}: ${httpError.statusText}`;
            }

            this.showError(message);
        }
    });
}

  viewDetails(id: string) {
    this.router.navigate(['/tabs/solicitudes/detalle', id]);
  }

  showSuccess(message: string) {
    this.toastType = "success"
    this.toastMessage = message
    this.showToast = true

    setTimeout(() => {
      this.showToast = false
    }, 3000)
  }

  showError(message: string) {
    this.toastType = "error"
    this.toastMessage = message
    this.showToast = true

    setTimeout(() => {
      this.showToast = false
    }, 3000)
  }
}