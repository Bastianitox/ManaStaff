import { Component, type OnInit } from "@angular/core"
import { Router } from '@angular/router'

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

const MOCK_SOLICITUDES: Solicitud[] = [
  {
    id: "1",
    asunto: "Solicitud de vacaciones",
    descripcion: "Vacaciones de verano del 10 al 15 de noviembre",
    estado: "pendiente",
    fecha_solicitud: "2024-10-25",
    fecha_inicio: "2024-11-10",
    fecha_fin: "2024-11-15",
    fecha_vista: null,
    tipo_solicitud_id: "vac",
    tipo_solicitud_nombre: "Vacaciones",
  },
  {
    id: "2",
    asunto: "Permiso médico",
    descripcion: "Cita médica de control programada",
    estado: "aprobada",
    fecha_solicitud: "2024-10-20",
    fecha_inicio: "2024-10-28",
    fecha_fin: "2024-10-28",
    fecha_vista: "2024-10-21",
    tipo_solicitud_id: "med",
    tipo_solicitud_nombre: "Permiso médico",
  },
  {
    id: "3",
    asunto: "Solicitud de teletrabajo",
    descripcion: "Trabajo remoto por motivos personales",
    estado: "rechazada",
    fecha_solicitud: "2024-10-15",
    fecha_inicio: "2024-10-22",
    fecha_fin: "2024-10-26",
    fecha_vista: "2024-10-16",
    tipo_solicitud_id: "tel",
    tipo_solicitud_nombre: "Teletrabajo",
  },
  {
    id: "4",
    asunto: "Permiso por asuntos personales",
    descripcion: "Trámites bancarios urgentes",
    estado: "aprobada",
    fecha_solicitud: "2024-10-18",
    fecha_inicio: "2024-10-30",
    fecha_fin: "2024-10-30",
    fecha_vista: "2024-10-19",
    tipo_solicitud_id: "per",
    tipo_solicitud_nombre: "Permiso personal",
  },
  {
    id: "5",
    asunto: "Solicitud de capacitación",
    descripcion: "Curso de actualización profesional",
    estado: "pendiente",
    fecha_solicitud: "2024-10-22",
    fecha_inicio: null,
    fecha_fin: null,
    fecha_vista: null,
    tipo_solicitud_id: "cap",
    tipo_solicitud_nombre: "Capacitación",
  },
]

@Component({
  selector: "app-iniciosoli",
  templateUrl: "./iniciosoli.page.html",
  styleUrls: ["./iniciosoli.page.scss"],
  standalone: false
})
export class IniciosoliPage implements OnInit {
  solicitudes: Solicitud[] = [...MOCK_SOLICITUDES]
  filteredSolicitudes: Solicitud[] = [...MOCK_SOLICITUDES]
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

  constructor(
    private router: Router
  ) {}

  ngOnInit() {
    // Extraer tipos únicos de solicitudes
    const tiposMap = new Map<string, string>()
    this.solicitudes.forEach((sol) => {
      tiposMap.set(sol.tipo_solicitud_id, sol.tipo_solicitud_nombre)
    })

    this.tipoOptions = Array.from(tiposMap.entries()).map(([id, nombre]) => ({
      id,
      nombre,
    }))

    // Inicializar filtros de tipo
    this.tipoOptions.forEach((tipo) => {
      this.filters.tipo[tipo.id] = false
    })
  }

  createNewRequest() {
    console.log("Crear nueva solicitud")
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
    this.closeFilterModal()
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
    if (solicitud.fecha_inicio && !solicitud.fecha_fin) {
      return `${solicitud.fecha_inicio} - Decisión pendiente`
    }

    if (solicitud.fecha_inicio && solicitud.fecha_fin) {
      if (solicitud.fecha_inicio === solicitud.fecha_fin) {
        return solicitud.fecha_inicio
      }
      return `${solicitud.fecha_inicio} - ${solicitud.fecha_fin}`
    }

    return "En revisión"
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
    console.log("Confirmar cancelación", this.selectedRequestId)
    this.showSuccess("Solicitud cancelada correctamente")
    this.closeCancelModal()
  }

  viewDetails(id: string) {
    console.log("Ver detalles", id)
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
    console.log("Navegar a Noticias")
    this.router.navigateByUrl("/inicioavisos")
  }

  goToConfig() {
    console.log("Navegar a Configuración")
  }
}