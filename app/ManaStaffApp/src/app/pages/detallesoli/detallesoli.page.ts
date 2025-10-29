import { Component, OnInit } from "@angular/core"
import { Router } from "@angular/router"

interface SolicitudDetalle {
  id: string
  asunto: string
  descripcion: string
  estado: "pendiente" | "aprobada" | "rechazada"
  tipo_solicitud_nombre: string
  fecha_solicitud: string
  fecha_vista: string | null
  fecha_inicio: string | null
  fecha_fin: string | null
  razon?: string | null
  archivoUrl?: string | null
  archivoNombre?: string | null
}

@Component({
  selector: 'app-detallesoli',
  templateUrl: './detallesoli.page.html',
  styleUrls: ['./detallesoli.page.scss'],
  standalone: false
})
export class DetallesoliPage implements OnInit {
  // solicitud de ejemplo
  solicitud: SolicitudDetalle = {
    id: "1",
    asunto: "Solicitud de vacaciones - Verano 2024",
    descripcion: "Solicito vacaciones del 10 al 15 de noviembre para asuntos personales. Agradezco su consideración.",
    estado: "aprobada",
    tipo_solicitud_nombre: "Vacaciones",
    fecha_solicitud: "2024-10-20",
    fecha_vista: "2024-10-22",
    fecha_inicio: "2024-11-10",
    fecha_fin: "2024-11-15",
    razon: null,
    archivoUrl: "https://example.com/archivo.pdf",
    archivoNombre: "justificacion_vacaciones.pdf",
  }

  constructor(private router: Router) {}

  ngOnInit() {
    console.log("Detalle de solicitud cargado:", this.solicitud)
  }

  goBack() {
    this.router.navigate(["/iniciosoli"])
  }

  getDateRange(solicitud: SolicitudDetalle): string {
    const inicio = solicitud.fecha_inicio
    const fin = solicitud.fecha_fin

    if (!inicio && !fin) {
      return "En revisión"
    }

    if (inicio && !fin) {
      return `${inicio} - Decisión pendiente`
    }

    if (inicio === fin) {
      return inicio ?? "En revisión"
    }

    if (inicio && fin) {
      return `${inicio} - ${fin}`
    }

    return "En revisión"
  }

  // Navegación
  goToDocumentos() {
    console.log("[verdoc] Navegar a Mis documentos (bottom nav)")
    this.router.navigate(['/iniciodoc'])
  }

  goToSolicitudes() {
    console.log("Navegar a Solicitudes")
    this.router.navigate(["/iniciosoli"])
  }

  goToNoticias() {
    console.log("Navegar a Noticias y avisos")
  }

  goToConfig() {
    console.log("Navegar a Configuración")
  }
}