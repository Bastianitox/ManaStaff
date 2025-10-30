import { Component, OnInit, ViewChildren, QueryList, ElementRef } from "@angular/core"
import { AlertController } from "@ionic/angular"
import { Router } from '@angular/router'

// Interfaces
interface Document {
  id: string
  name: string
  type: "PDF" | "DOCX" | "XLS" | "DOC"
  size: string
  date: string
  status: "Activo" | "Pendiente" | "Caducado"
}

interface Filters {
  types: { [key: string]: boolean }
  sizes: { [key: string]: boolean }
  statuses: { [key: string]: boolean }
  sortBy: "date" | "name"
  sortOrder: "asc" | "desc"
}

// Datos falsos
const MOCK_DOCUMENTS: Document[] = [
  {
    id: "1",
    name: "Contrato de Servicios 2024",
    type: "PDF",
    size: "2.4 MB",
    date: "2024-06-20",
    status: "Activo",
  },
  {
    id: "2",
    name: "Factura Mensual Junio",
    type: "PDF",
    size: "1.2 MB",
    date: "2024-06-15",
    status: "Activo",
  },
  {
    id: "3",
    name: "Propuesta Comercial",
    type: "DOCX",
    size: "3.8 MB",
    date: "2024-06-10",
    status: "Pendiente",
  },
  {
    id: "4",
    name: "Reporte Trimestral Q2",
    type: "XLS",
    size: "0.9 MB",
    date: "2024-06-05",
    status: "Activo",
  },
  {
    id: "5",
    name: "Certificado de Cumplimiento",
    type: "PDF",
    size: "1.5 MB",
    date: "2024-05-28",
    status: "Caducado",
  },
  {
    id: "6",
    name: "Manual de Procedimientos",
    type: "DOCX",
    size: "4.2 MB",
    date: "2024-05-20",
    status: "Activo",
  },
  {
    id: "7",
    name: "Presupuesto 2024",
    type: "XLS",
    size: "2.1 MB",
    date: "2024-05-15",
    status: "Pendiente",
  },
  {
    id: "8",
    name: "Acta de Reunión Mayo",
    type: "DOC",
    size: "0.7 MB",
    date: "2024-05-10",
    status: "Activo",
  },
]

@Component({
  selector: "app-iniciodoc",
  templateUrl: "./iniciodoc.page.html",
  styleUrls: ["./iniciodoc.page.scss"],
  standalone: false,
})
export class IniciodocPage implements OnInit {
  // Estado de la interfaz
  showPinModal = true
  showFilterModal = false
  isLoading = false

  pinInputs: string[] = ["", "", "", ""]
  pinError = ""
  correctPin = "1234"

  searchQuery = ""
  documents: Document[] = []
  filteredDocuments: Document[] = []

  documentTypes = ["PDF", "DOCX", "XLS", "DOC"]
  statusOptions = ["Activo", "Pendiente", "Caducado"]
  sizeOptions = [
    { key: "small", label: "Menos de 1 MB" },
    { key: "medium", label: "1-3 MB" },
    { key: "large", label: "Más de 3 MB" },
  ]

  filters: Filters = {
    types: { PDF: false, DOCX: false, XLS: false, DOC: false },
    sizes: { small: false, medium: false, large: false },
    statuses: { Activo: false, Pendiente: false, Caducado: false },
    sortBy: "date",
    sortOrder: "desc",
  }

  @ViewChildren("pinField") pinFields!: QueryList<ElementRef>

  // Constructor -> para mostrar alertas
  constructor(
    private alertController: AlertController,
    private router: Router) {

    this.documents = [...MOCK_DOCUMENTS]
    this.filteredDocuments = [...MOCK_DOCUMENTS]
  }

  ngOnInit() {}

  // Modal del pin
  onPinInput(index: number, event: any) {
    const value = event.target.value

    if (value && /^\d$/.test(value)) {
      this.pinInputs[index] = value

      // pasa el foco al siguiente automaticamente
      if (index < 3) {
        const nextInput = this.pinFields.toArray()[index + 1]
        if (nextInput) {
          setTimeout(() => nextInput.nativeElement.focus(), 0)
        }
      }
    } else if (!value) {
      this.pinInputs[index] = ""
    }

    this.pinError = ""
  }

  verifyPin() {
    const enteredPin = this.pinInputs.join("")

    if (enteredPin === this.correctPin) {
      this.showPinModal = false
      this.pinError = ""
      this.applyFilters()
    } else {
      this.pinError = "Código PIN incorrecto. Intenta de nuevo."
      this.pinInputs = ["", "", "", ""]
      const firstInput = this.pinFields.toArray()[0]
      if (firstInput) {
        setTimeout(() => firstInput.nativeElement.focus(), 0)
      }
    }
  }

  isPinIncomplete(): boolean {
    return this.pinInputs.some((p) => !p || p.trim() === "")
  }

  // Buscador
  onSearch(event: any) {
    this.searchQuery = event.detail.value || ""
    this.applyFilters()
  }

  // Modal de filtros
  openFilterModal() {
    this.showFilterModal = true
  }

  closeFilterModal() {
    this.showFilterModal = false
  }

  applyFilters() {
    let filtered = [...this.documents]

    // filtro por búsqueda de texto (nombre o tipo)
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase()
      filtered = filtered.filter(
        (doc) => doc.name.toLowerCase().includes(query) || doc.type.toLowerCase().includes(query),
      )
    }

    // filtro por tipos de documentos
    const selectedTypes = Object.keys(this.filters.types).filter((key) => this.filters.types[key])
    if (selectedTypes.length > 0) {
      filtered = filtered.filter((doc) => selectedTypes.includes(doc.type))
    }

    const selectedSizes = Object.keys(this.filters.sizes).filter((key) => this.filters.sizes[key])
    if (selectedSizes.length > 0) {
      filtered = filtered.filter((doc) => {
        const sizeNum = Number.parseFloat(doc.size)
        return selectedSizes.some((size) => {
          if (size === "small") return sizeNum < 1
          if (size === "medium") return sizeNum >= 1 && sizeNum <= 3
          if (size === "large") return sizeNum > 3
          return false
        })
      })
    }

    // filtro por estado activo, pendiente y caducado
    const selectedStatuses = Object.keys(this.filters.statuses).filter((key) => this.filters.statuses[key])
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter((doc) => selectedStatuses.includes(doc.status))
    }

    // Sorting
    filtered.sort((a, b) => {
      let compareValue = 0

      if (this.filters.sortBy === "date") {
        compareValue = new Date(a.date).getTime() - new Date(b.date).getTime()
      } else if (this.filters.sortBy === "name") {
        compareValue = a.name.localeCompare(b.name)
      }

      return this.filters.sortOrder === "asc" ? compareValue : -compareValue
    })

    this.filteredDocuments = filtered
  }

  clearFilters() {
    this.filters = {
      types: { PDF: false, DOCX: false, XLS: false, DOC: false },
      sizes: { small: false, medium: false, large: false },
      statuses: { Activo: false, Pendiente: false, Caducado: false },
      sortBy: "date",
      sortOrder: "desc",
    }
    this.searchQuery = ""
    this.applyFilters()
  }

  // Acciones sobre los documentos
  getFileIcon(type: string): string {
    const iconMap: { [key: string]: string } = {
      PDF: "document-outline",
      DOCX: "document-text-outline",
      DOC: "document-text-outline",
      XLS: "document-outline",
    }
    return iconMap[type] || "document-outline"
  }

  viewDocument(doc: Document) {
    console.log("[iniciodoc] Abriendo documento:", doc.name)
    this.router.navigate(['/verdoc'], {
      state: { document: doc } 
    })
  }

  async downloadDocument(doc: Document) {
    const alert = await this.alertController.create({
      header: "Descargar",
      message: `Descargando: ${doc.name}`,
      buttons: ["OK"],
    })
    await alert.present()
  }

  goToDocumentos() {
    console.log("[verdoc] Navegar a Mis documentos (bottom nav)")
    this.router.navigate(['/iniciodoc'])
  }

  goToNoticias() {
    console.log("Navegando a Noticias y avisos")
    this.router.navigate(["/inicioavisos"])
  }

  goToSolicitudes() {
    console.log("Navegar a Solicitudes")
    this.router.navigate(["/iniciosoli"])
  }

  goToConfig() {
    console.log("[verdoc] Navegar a Configuración")
    this.router.navigate(["/configuracion"])
  }
}