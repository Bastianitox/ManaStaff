import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router"

@Component({
  selector: 'app-crearsoli',
  templateUrl: './crearsoli.page.html',
  styleUrls: ['./crearsoli.page.scss'],
  standalone: false
})
export class CrearsoliPage implements OnInit {
  tipoOptions = [
    { id: "vac", nombre: "Vacaciones" },
    { id: "med", nombre: "Permiso médico" },
    { id: "tel", nombre: "Teletrabajo" },
    { id: "per", nombre: "Permiso personal" },
    { id: "cap", nombre: "Capacitación" },
  ]

  selectOptions = {
    header: "Tipo de solicitud",
    subHeader: "Selecciona el tipo de solicitud que deseas crear",
    cssClass: "custom-action-sheet",
  }

  selectedTipo = ""
  titulo = ""
  descripcion = ""
  selectedFile: { name: string; size: number } | null = null
  isSubmitting = false

  showToast = false
  toastMessage = ""
  toastType: "success" | "error" | null = null

  constructor(private router: Router) {}

  ngOnInit() {}

  goBack() {
    this.router.navigate(["/iniciosoli"])
  }

  goToDocumentos() {
    console.log("Navegar a Mis documentos")
    this.router.navigate(["/iniciodoc"])
  }

  goToSolicitudes() {
    console.log("Navegar a Solicitudes")
    this.router.navigate(["/iniciosoli"])
  }

  goToNoticias() {
    console.log("Navegar a Noticias y avisos")
    this.router.navigateByUrl("/inicioavisos")
  }

  goToConfig() {
    console.log("[verdoc] Navegar a Configuración")
    this.router.navigate(["/configuracion"])
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

      this.selectedFile = {
        name: file.name,
        size: file.size,
      }
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
    // Validar campos requeridos
    if (!this.selectedTipo) {
      this.showError("Por favor selecciona un tipo de solicitud")
      return
    }

    if (!this.titulo.trim()) {
      this.showError("Por favor ingresa un título para la solicitud")
      return
    }

    if (!this.descripcion.trim()) {
      this.showError("Por favor ingresa una descripción")
      return
    }

    // Simular envío
    this.isSubmitting = true

    setTimeout(() => {
      this.isSubmitting = false
      this.showSuccess("Solicitud enviada correctamente")

      // Resetear formulario después de 2 segundos
      setTimeout(() => {
        this.resetForm()
        this.goBack()
      }, 2000)
    }, 1500)
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