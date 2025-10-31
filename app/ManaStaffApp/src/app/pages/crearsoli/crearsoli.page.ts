import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router"
import { finalize } from 'rxjs';
import { SolicitudesApiService } from 'src/app/services/solicitudes-api';


interface tipoSolicitud {
  id: string
  nombre: string
}

@Component({
  selector: 'app-crearsoli',
  templateUrl: './crearsoli.page.html',
  styleUrls: ['./crearsoli.page.scss'],
  standalone: false
})
export class CrearsoliPage implements OnInit {
  tipoOptions: tipoSolicitud[] = []

  selectOptions = {
    header: "Tipo de solicitud",
    subHeader: "Selecciona el tipo de solicitud que deseas crear",
    cssClass: "custom-action-sheet",
  }

  selectedTipo = ""
  titulo = ""
  descripcion = ""
  selectedFile: File | null = null
  isSubmitting = false
  isLoadingTypes = false

  showToast = false
  toastMessage = ""
  toastType: "success" | "error" | null = null

  constructor(
    private router: Router,
    private solicitudApi: SolicitudesApiService
  ) { }

  ngOnInit() {
    this.cargarTiposSolicitud();
  }

  cargarTiposSolicitud(refresher?: any){
    this.isLoadingTypes = true;
    
    this.solicitudApi.obtenerTiposSolicitud()
      .pipe(finalize(() => {
        this.isLoadingTypes = false;
        if (refresher) { refresher.target.complete(); }
      }))
      .subscribe({
        next: (response) => {
          if (response.status === "success") {
            this.tipoOptions = response.tipos as tipoSolicitud[]; 
            console.log("Tipos de solicitud cargados:", this.tipoOptions);
          } else {
            this.showError(response.message || "Error al obtener los tipos de solicitud.");
            this.tipoOptions = [];
          }
        },
        error: (httpError) => {
          let message = "Error de conexión con el servidor.";
          if (httpError.status === 401) {
            message = "Su sesión ha expirado o no está autorizado.";
          } else if (httpError.error && httpError.error.error) {
              message = httpError.error.error;
          }
          this.showError(message);
          this.tipoOptions = [];
        }
      });
  }

  goBack() {
    this.router.navigate(["/tabs/solicitudes"])
  }

  onFileSelected(event: any) {
    const file = event.target.files[0]
    if (file) {
      // Validar tamaño (10 MB máximo)
      const maxSize = 10 * 1024 * 1024
      if (file.size > maxSize) {
        this.showError("El archivo excede el tamaño máximo de 10 MB")
        return
      }

      this.selectedFile = file
    } else {
        this.selectedFile = null;
    }
  }

  removeFile() {
    this.selectedFile = null
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  resetForm() {
    this.selectedTipo = ""
    this.titulo = ""
    this.descripcion = ""
    this.selectedFile = null
  }

  submitRequest() {
    // 1. Validar campos requeridos
    if (!this.selectedTipo || !this.titulo.trim() || !this.descripcion.trim()) {
      this.showError("Por favor completa todos los campos obligatorios.")
      return
    }

    // 2. Crear FormData
    const formData = new FormData();
    formData.append('tipos_solicitud', this.selectedTipo);
    formData.append('asunto', this.titulo);
    formData.append('descripcion', this.descripcion);
    
    if (this.selectedFile) {
      formData.append('archivo', this.selectedFile, this.selectedFile.name);
    }
    
    this.isSubmitting = true

    // 3. Llamar a la API
    this.solicitudApi.crearSolicitud(formData)
      .pipe(finalize(() => {
        this.isSubmitting = false; // Detener spinner en éxito o error
      }))
      .subscribe({
        next: (response) => {
          this.showSuccess(response.message || "Solicitud enviada correctamente")

          // Resetear formulario y navegar
          setTimeout(() => {
            this.resetForm()
            this.goBack() 
          }, 2000)
        },
        error: (httpError) => {
          // Manejar errores de Django (400, 415, 500)
          const errorMessage = httpError.error?.error || httpError.error?.message || "Error desconocido al enviar la solicitud.";
          this.showError(errorMessage);
        }
      });
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