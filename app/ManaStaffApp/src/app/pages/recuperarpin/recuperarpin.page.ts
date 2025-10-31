import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router"

@Component({
  selector: 'app-recuperarpin',
  templateUrl: './recuperarpin.page.html',
  styleUrls: ['./recuperarpin.page.scss'],
  standalone: false
})
export class RecuperarpinPage implements OnInit {
  // Datos del usuario
  userEmail = "usuario@ejemplo.com" 

  // Campos del formulario
  verificationCode = ""
  newPin = ""
  confirmPin = ""

  // controles de visibilidad de los inputs
  showNewPin = false
  showConfirmPin = false

  // Estados del flujo
  showCodeSection = false
  showPinSection = false

  // Estados de carga
  isRequestingCode = false
  isVerifyingCode = false
  isUpdatingPin = false

  // Toast
  showToast = false
  toastType: "success" | "error" = "success"
  toastMessage = ""

  constructor(private router: Router) {}

  ngOnInit() {
  }

  // Solicitar código de verificación
  async solicitarCodigo() {
    if (this.isRequestingCode) return

    this.isRequestingCode = true

    // Simular llamada a API
    setTimeout(() => {
      this.isRequestingCode = false

      // Simular éxito
      const success = true

      if (success) {
        this.showCodeSection = true
        this.toastType = "success"
        this.toastMessage = "Código enviado a tu correo electrónico"
        this.showToast = true

        setTimeout(() => {
          this.showToast = false
        }, 3000)
      } else {
        this.toastType = "error"
        this.toastMessage = "Error al enviar el código. Intenta nuevamente."
        this.showToast = true

        setTimeout(() => {
          this.showToast = false
        }, 3000)
      }
    }, 1500)
  }

  // Verificar código
  async verificarCodigo() {
    if (this.isVerifyingCode || this.verificationCode.length !== 6) return

    this.isVerifyingCode = true

    // Simular llamada a API
    setTimeout(() => {
      this.isVerifyingCode = false

      // Simular éxito
      const success = true

      if (success) {
        this.showPinSection = true
        this.toastType = "success"
        this.toastMessage = "Código verificado correctamente"
        this.showToast = true

        setTimeout(() => {
          this.showToast = false
        }, 3000)
      } else {
        this.toastType = "error"
        this.toastMessage = "Código incorrecto. Verifica e intenta nuevamente."
        this.showToast = true

        setTimeout(() => {
          this.showToast = false
        }, 3000)
      }
    }, 1500)
  }

  // Actualizar PIN
  async actualizarPin() {
    if (this.isUpdatingPin || !this.isPinFormValid) return

    this.isUpdatingPin = true

    // Simular llamada a API
    setTimeout(() => {
      this.isUpdatingPin = false

      // Simular éxito
      const success = true

      if (success) {
        this.toastType = "success"
        this.toastMessage = "¡PIN actualizado correctamente!"
        this.showToast = true

        setTimeout(() => {
          this.showToast = false
          // Redirigir a configuración después de éxito
          this.router.navigateByUrl("/tabs/configuracion")
        }, 2000)
      } else {
        this.toastType = "error"
        this.toastMessage = "Error al actualizar el PIN. Intenta nuevamente."
        this.showToast = true

        setTimeout(() => {
          this.showToast = false
        }, 3000)
      }
    }, 1500)
  }

  // Permitir solo números
  onlyNumbers(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      event.preventDefault()
      return false
    }
    return true
  }

  // Manejar input de código
  onCodeInput(event: any) {
    const value = event.target.value
    const numericValue = value.replace(/\D/g, "")
    const limitedValue = numericValue.slice(0, 6)
    this.verificationCode = limitedValue
    event.target.value = limitedValue
  }

  // Manejar input de PIN
  onPinInput(event: any, field: "new" | "confirm") {
    const value = event.target.value
    const numericValue = value.replace(/\D/g, "")
    const limitedValue = numericValue.slice(0, 4)

    if (field === "new") {
      this.newPin = limitedValue
    } else {
      this.confirmPin = limitedValue
    }

    event.target.value = limitedValue
  }

  // Navegación
  goBack() {
    this.router.navigateByUrl("/tabs/configuracion")
  }

  // Getters
  get pinsMatch(): boolean {
    return this.newPin === this.confirmPin && this.confirmPin.length > 0
  }

  get isPinFormValid(): boolean {
    return this.newPin.length === 4 && this.confirmPin.length === 4 && this.pinsMatch
  }
}