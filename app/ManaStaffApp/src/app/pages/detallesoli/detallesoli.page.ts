import { Component, OnInit } from "@angular/core"
import { Router, ActivatedRoute } from "@angular/router" // ⬅️ Importar ActivatedRoute
import { DatePipe } from "@angular/common"; // ⬅️ Utilidad para formatear fechas
import { SolicitudesApiService } from "src/app/services/solicitudes-api";

// Interfaz para el objeto que viene de la API
interface SolicitudDetalle {
  id: string
  Asunto: string
  Descripcion: string
  Estado: "pendiente" | "aprobada" | "rechazada"
  tipo_solicitud: string
  tipo_solicitud_nombre: string
  Fecha_solicitud: string
  fecha_vista: string | null
  Fecha_inicio: string | null
  Fecha_fin: string | null
  Razon?: string | null
  archivo?: string | null
  archivo_name?: string | null 
}

@Component({
  selector: 'app-detallesoli',
  templateUrl: './detallesoli.page.html',
  styleUrls: ['./detallesoli.page.scss'],
  standalone: false,
  providers: [DatePipe] // Proveedor para usar el pipe en el código TS
})
export class DetallesoliPage implements OnInit {
  solicitudId: string | null = null;
  
  // Inicializamos la solicitud con valores que permitan cargar la interfaz sin errores
  solicitud: SolicitudDetalle = {
    id: "",
    Asunto: "Cargando...",
    Descripcion: "",
    Estado: "pendiente",
    tipo_solicitud: "",
    tipo_solicitud_nombre: "...",
    Fecha_solicitud: "",
    fecha_vista: null,
    Fecha_inicio: null,
    Fecha_fin: null,
    Razon: null,
    archivo: null,
    archivo_name: null 
  };
  
  isLoading = true;
  errorMessage: string | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private solicitudesApi: SolicitudesApiService,
    private datePipe: DatePipe
  ) {}

  ngOnInit() {
    // 1. Obtener el ID de la URL
    this.solicitudId = this.route.snapshot.paramMap.get('id');

    if (this.solicitudId) {
      this.cargarDetalle(this.solicitudId);
    } else {
      this.isLoading = false;
      this.errorMessage = "ID de solicitud no encontrado en la ruta.";
      this.solicitud.Asunto = "Error";
    }
  }
  
  /**
   * 📲 Carga el detalle de la solicitud desde la API de Django.
   */
  cargarDetalle(id: string) {
    this.isLoading = true;
    this.errorMessage = null;

    this.solicitudesApi.obtenerDetalleSolicitud(id).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.status === 'success' && response.solicitud) {
          
          this.solicitud = {
            ...response.solicitud,
            archivo_name: response.solicitud.archivo_name || null // Usar el nombre del archivo
          } as SolicitudDetalle;

        } else {
          this.errorMessage = response.message || "No se pudo cargar el detalle de la solicitud.";
          this.solicitud.Asunto = "Error de Datos";
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
        this.solicitud.Asunto = "Error de Carga";
      }
    });
  }

  goBack() {
    this.router.navigate(["/tabs/solicitudes"])
  }

  /**
   * Formatea la fecha para ser más legible
   */
  formatDisplayDate(dateString: string | null): string | null {
    if (!dateString || dateString.toLowerCase() === 'null') {
      return null;
    }
    // Usamos el DatePipe para formatear las fechas con un formato corto y amigable
    return this.datePipe.transform(dateString.replace(' ', 'T'), 'dd/MM/yyyy');
  }

  /**
   * Devuelve el rango de fechas formateado
   */
  getDateRange(solicitud: SolicitudDetalle): string {
    const inicio = this.formatDisplayDate(solicitud.Fecha_inicio);
    const fin = this.formatDisplayDate(solicitud.Fecha_fin);

    if (!inicio && !fin) {
      return "En revisión";
    }

    if (inicio && !fin) {
      return `${inicio} - Decisión pendiente`;
    }

    if (inicio === fin) {
      return inicio ?? "En revisión";
    }

    if (inicio && fin) {
      return `${inicio} - ${fin}`;
    }

    return "En revisión";
  }
  
  // Navegación (sin cambios)
  goToDocumentos() {
    this.router.navigate(['/iniciodoc'])
  }

  goToSolicitudes() {
    this.router.navigate(["/iniciosoli"])
  }

  goToNoticias() {
    this.router.navigateByUrl("/inicioavisos")
  }

  goToConfig() {
    this.router.navigate(["/configuracion"])
  }
}
