import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router"

@Component({
  selector: 'app-cambiarpin',
  templateUrl: './cambiarpin.page.html',
  styleUrls: ['./cambiarpin.page.scss'],
  standalone: false
})
export class CambiarpinPage implements OnInit {
  // Campos del formulario
  currentPin = ""
  newPin = ""
  confirmPin = ""

  showCurrentPin = false
  showNewPin = false
  showConfirmPin = false

  // Estado del formulario
  isFormValid = false
  isSubmitting = false
  pinsMatch = false

  // Toast
  showToast = false
  toastType: "success" | "error" = "success"
  toastMessage = ""

  constructor(private router: Router) {}

  ngOnInit() {}

  // Permitir solo números
  onlyNumbers(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      event.preventDefault()
      return false
    }
    return true
  }

  // Manejar input de PIN
  onPinInput(event: any, field: "current" | "new" | "confirm") {
    const value = event.target.value

    // Eliminar caracteres no numéricos
    const numericValue = value.replace(/\D/g, "")

    // Limitar a 4 dígitos
    const limitedValue = numericValue.slice(0, 4)

    // Actualizar el campo correspondiente
    if (field === "current") {
      this.currentPin = limitedValue
    } else if (field === "new") {
      this.newPin = limitedValue
    } else if (field === "confirm") {
      this.confirmPin = limitedValue
    }

    // Actualizar el valor del input
    event.target.value = limitedValue

    // Validar formulario
    this.validateForm()
  }

  // Validar formulario
  validateForm() {
    // Verificar si los PIN nuevos coinciden
    this.pinsMatch = this.newPin.length === 4 && this.confirmPin.length === 4 && this.newPin === this.confirmPin

    // El formulario es válido si:
    // - El PIN actual tiene 4 dígitos
    // - El nuevo PIN tiene 4 dígitos
    // - El PIN de confirmación tiene 4 dígitos
    // - Los PIN nuevos coinciden
    this.isFormValid =
      this.currentPin.length === 4 && this.newPin.length === 4 && this.confirmPin.length === 4 && this.pinsMatch
  }

  // Cambiar PIN
  async changePin() {
    if (!this.isFormValid || this.isSubmitting) {
      return
    }

    this.isSubmitting = true

    // Simular llamada a API
    setTimeout(() => {
      this.isSubmitting = false

      // Simular éxito 
      const success = true

      if (success) {
        this.toastType = "success"
        this.toastMessage = "¡PIN actualizado correctamente!"
        this.showToast = true

        // Limpiar formulario después de éxito
        setTimeout(() => {
          this.resetForm()
          this.showToast = false
        }, 2000)
      } else {
        this.toastType = "error"
        this.toastMessage = "Error al cambiar el PIN. Intenta nuevamente."
        this.showToast = true

        setTimeout(() => {
          this.showToast = false
        }, 3000)
      }
    }, 1500)
  }

  // Resetear formulario
  resetForm() {
    this.currentPin = ""
    this.newPin = ""
    this.confirmPin = ""
    this.showCurrentPin = false
    this.showNewPin = false
    this.showConfirmPin = false
    this.isFormValid = false
    this.pinsMatch = false
  }

  // Navegación
  goBack() {
    this.router.navigateByUrl("/configuracion")
  }

  goToDocumentos() {
    this.router.navigateByUrl("/iniciodoc")
  }

  goToSolicitudes() {
    this.router.navigateByUrl("/iniciosoli")
  }

  goToNoticias() {
    this.router.navigateByUrl("/inicioavisos")
  }

  goToConfig() {
    this.router.navigateByUrl("/configuracion")
  }
}