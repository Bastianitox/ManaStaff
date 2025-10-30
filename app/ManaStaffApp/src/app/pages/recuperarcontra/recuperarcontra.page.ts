import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router"

@Component({
  selector: 'app-recuperarcontra',
  templateUrl: './recuperarcontra.page.html',
  styleUrls: ['./recuperarcontra.page.scss'],
  standalone: false
})
export class RecuperarcontraPage implements OnInit {
  // Campos del formulario
  email = ""

  // Estados de carga
  isSending = false

  // Toast
  showToast = false
  toastType: "success" | "error" = "success"
  toastMessage = ""

  constructor(private router: Router) {}

  ngOnInit() {}

  // Validar email
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Validar formulario
  get isFormValid(): boolean {
    return this.isValidEmail(this.email)
  }

  // Enviar código de recuperación
  async enviarCorreo() {
    if (!this.isFormValid || this.isSending) {
      return
    }

    this.isSending = true

    // Simular llamada a API
    setTimeout(() => {
      this.isSending = false

      // Simular éxito
      const success = true

      if (success) {
        this.toastType = "success"
        this.toastMessage = "Código enviado correctamente. Revisa tu correo."
        this.showToast = true

        setTimeout(() => {
          this.showToast = false
          this.email = ""
        }, 3000)
      } else {
        this.showError("No se pudo enviar el código. Intenta nuevamente.")
      }
    }, 1500)
  }

  // Mostrar error
  showError(message: string) {
    this.toastType = "error"
    this.toastMessage = message
    this.showToast = true

    setTimeout(() => {
      this.showToast = false
    }, 3000)
  }

  // Volver a login
  goToLogin() {
    this.router.navigateByUrl("/login")
  }
}
