import { Component, OnInit, ViewChildren, QueryList, ElementRef } from "@angular/core"
import { AlertController, Platform, ToastController } from "@ionic/angular"
import { Router } from '@angular/router'
import { DocumentosApi } from "src/app/services/documentos-api"
import { Directory, Filesystem } from '@capacitor/filesystem';
import { HttpClient, HttpEventType, HttpResponse } from "@angular/common/http";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";
import { FileOpener } from "@capacitor-community/file-opener";
import { Download } from "src/app/services/download";

// Interfaces
interface Document {
  id: string
  Fecha_emitida: string
  id_empleador: string
  nombre: string
  storage_bucket: string
  storage_path: string
  tamano_archivo: string
  tipo_documento: string
  url: string
  Tipoestado: string
  tipo_estado_nombre: string
}

interface Filters {
  types: { [key: string]: boolean }
  sizes: { [key: string]: boolean }
  statuses: { [key: string]: boolean }
  sortBy: "date" | "name"
  sortOrder: "asc" | "desc"
}

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
  private initialLoadCompleted = false;

  get activeDownloads() {
    return this.downloadService.activeDownloads;
  }

  pinInputs: string[] = ["", "", "", ""]
  pinError = ""
  correctPin = "1234"

  searchQuery = ""
  documents: Document[] = []
  filteredDocuments: Document[] = []

  documentTypes = ["PDF", "DOCX", "XLS", "DOC", "Otro"]
  statusOptions = ["Activo", "Pendiente", "Caducado"]
  sizeOptions = [
    { key: "small", label: "Menos de 1 MB" },
    { key: "medium", label: "1-3 MB" },
    { key: "large", label: "Más de 3 MB" },
  ]

  filters: Filters = {
    types: { PDF: false, DOCX: false, XLS: false, DOC: false, Otro: false },
    sizes: { small: false, medium: false, large: false },
    statuses: { Activo: false, Pendiente: false, Caducado: false },
    sortBy: "date",
    sortOrder: "desc",
  }

  @ViewChildren("pinField") pinFields!: QueryList<ElementRef>


  constructor(
    private router: Router,
    private documentosApi: DocumentosApi,
    private downloadService: Download) {

    this.documents = []
    this.filteredDocuments = []
  }

  ngOnInit() {
    this.obtener_documentos();
  }

  obtener_documentos(refresher?: any){
    this.isLoading = true

    this.documentosApi.obtenerPublicaciones().subscribe({
      next: (response) => {
        this.isLoading = false

        if (response.status == "success"){

          this.documents = response.documentos as Document[];

          this.applyFilters()
        }else {
          this.documents = []
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
        this.documents = [];

        if (refresher) {
          refresher.target.complete();
        }
      }
    })

  }

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
        (doc) => doc.nombre.toLowerCase().includes(query) || doc.tipo_documento.toLowerCase().includes(query),
      )
    }

    // filtro por tipos de documentos
    const knownTypes = ["PDF", "DOCX", "XLS", "DOC"].map(t => t.toUpperCase()); 

    const selectedTypes = Object.keys(this.filters.types).filter((key) => this.filters.types[key])

    if (selectedTypes.length > 0) {
         // Separamos 'Otro' de los tipos específicos seleccionados
        const selectedSpecificTypes = selectedTypes.filter(type => type !== 'Otro').map(t => t.toUpperCase());
        const isOtherSelected = selectedTypes.includes('Otro');

        filtered = filtered.filter((doc) => {
        const docType = doc.tipo_documento.toUpperCase();
        const isKnownType = knownTypes.includes(docType);

        if (isKnownType) {
          return selectedSpecificTypes.includes(docType);
        } else {
          return isOtherSelected;
        }
      });
    }

    const selectedSizes = Object.keys(this.filters.sizes).filter((key) => this.filters.sizes[key])
    if (selectedSizes.length > 0) {
      filtered = filtered.filter((doc) => {
        const sizeNum = Number.parseFloat(doc.tamano_archivo)
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
      filtered = filtered.filter((doc) => selectedStatuses.includes(doc.tipo_estado_nombre))
    }

    // Sorting
    filtered.sort((a, b) => {
      let compareValue = 0

      if (this.filters.sortBy === "date") {
        // Asegurar que la comparación de fechas sea segura
        const dateA = new Date(a.Fecha_emitida).getTime();
        const dateB = new Date(b.Fecha_emitida).getTime();
        compareValue = dateA - dateB;
      } else if (this.filters.sortBy === "name") {
        compareValue = a.nombre.localeCompare(b.nombre)
      }

      return this.filters.sortOrder === "asc" ? compareValue : -compareValue
    })

    this.filteredDocuments = filtered
  }

  clearFilters() {
    this.filters = {
      types: { PDF: false, DOCX: false, XLS: false, DOC: false, Otro: false },
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

    return iconMap[type.toUpperCase()] || "document-outline" 
  }

  viewDocument(doc: Document) {
    console.log("[iniciodoc] Abriendo documento:", doc.nombre)
    this.router.navigate(['/tabs/documentos/ver'], {
      state: { document: doc } 
    })
  }

  // ---------------------------------------- DESCARGA ----------------------------------------

  async descargarDocumento(id_doc: string, nombre_archivo: string) {
    await this.downloadService.downloadAndSaveDocument(id_doc, nombre_archivo);
  }


}