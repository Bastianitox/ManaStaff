import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router"
import { finalize } from 'rxjs';
import { UsuarioService } from 'src/app/services/usuario-service';

@Component({
  selector: 'app-recuperarpin',
  templateUrl: './recuperarpin.page.html',
  styleUrls: ['./recuperarpin.page.scss'],
  standalone: false
})
export class RecuperarpinPage implements OnInit {
  // Datos del usuario
  userData: any = null

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

  constructor(
    private router: Router,
    private usuarioService: UsuarioService) {}

  async ngOnInit() {
    this.userData = this.usuarioService.userData;
  }

  // Solicitar código de verificación
  async solicitarCodigo() {
    if (this.isRequestingCode) return

    this.isRequestingCode = true

    const formData = new FormData
    formData.append('email', this.userData.correo)

    // Simular llamada a API

    this.usuarioService.enviarCodigo(formData)
      .pipe(finalize(() => {
        this.isRequestingCode = false;
      }))
      .subscribe({
        next: async (response) => {
          this.showCodeSection = true
          this.toastType = "success"
          this.toastMessage = "Código enviado a tu correo electrónico"
          this.showToast = true
          setTimeout(() => {
            this.showToast = false
          }, 3000)
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
      });
  }

  // Verificar código
  async verificarCodigo() {
    if (this.isVerifyingCode || this.verificationCode.length !== 6) return

    this.isVerifyingCode = true

    const formData = new FormData
    formData.append('email', this.userData.correo)
    formData.append('codigo', this.verificationCode)

    // Simular llamada a API

    this.usuarioService.verificarCodigo(formData)
      .pipe(finalize(() => {
        this.isVerifyingCode = false;
      }))
      .subscribe({
        next: async (response) => {
          this.showPinSection = true
          this.toastType = "success"
          this.toastMessage = "Código verificado correctamente"
          this.showToast = true
          setTimeout(() => {
            this.showToast = false
          }, 3000)
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
      });
  }

  async actualizarPin() {
    if (this.isUpdatingPin || !this.isPinFormValid) return

    this.isUpdatingPin = true

    const formData = new FormData
    formData.append('email', this.userData.correo)
    formData.append('codigo', this.verificationCode)
    formData.append('nuevo_pin', this.newPin)

    this.usuarioService.cambiarPINverificado(formData)
      .pipe(finalize(() => {
        this.isUpdatingPin = false;
      }))
      .subscribe({
        next: async (response) => {
          this.toastType = "success"
          this.toastMessage = "¡PIN actualizado correctamente!"
          this.showToast = true
          setTimeout(() => {
            this.showToast = false
            this.router.navigateByUrl("/tabs/configuracion")
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
      });
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