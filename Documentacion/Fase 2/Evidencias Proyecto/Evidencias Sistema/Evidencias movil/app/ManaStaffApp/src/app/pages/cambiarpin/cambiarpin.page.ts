import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router"
import { finalize } from 'rxjs';
import { UsuarioService } from 'src/app/services/usuario-service';

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

  constructor(
    private router: Router,
    private usuarioService: UsuarioService) {}

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

    const formData = new FormData
    formData.append('pin_actual', this.currentPin)
    formData.append('pin_nueva', this.newPin)
    formData.append('pin_confirmar', this.confirmPin)


    this.usuarioService.cambiarPIN(formData)
      .pipe((finalize(() => {
        this.isSubmitting = false;
      })))
      .subscribe({
        next: (response) =>{
          this.toastType = "success"
          this.toastMessage = "¡PIN actualizado correctamente!"
          this.showToast = true

          setTimeout(() => {
            this.resetForm()
            this.showToast = false
          }, 2000)
        },
        error: (httpError) => {
          const errorMessage = httpError.error?.error || httpError.error?.message || "Error desconocido al enviar la solicitud.";
          this.toastType = "error"
          this.toastMessage = errorMessage
          this.showToast = true

          setTimeout(() => {
            this.showToast = false
          }, 3000)
        }
      })
    
  }

  
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
    this.router.navigateByUrl("/tabs/configuracion")
  }
}