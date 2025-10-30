import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router"

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage implements OnInit {
  // Estados de la vista
  showLoginForm = false

  // Campos del formulario
  email = ""
  password = ""
  showPassword = false

  // Estados de carga
  isLoggingIn = false

  // Toast
  showToast = false
  toastType: "success" | "error" = "success"
  toastMessage = ""

  constructor(private router: Router) {}

  ngOnInit() {}

  // Mostrar formulario de login
  showLogin() {
    this.showLoginForm = true
  }

  // Validar email
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Validar formulario
  get isFormValid(): boolean {
    return this.isValidEmail(this.email) && this.password.length >= 6
  }

  // Login
  async login() {
    if (!this.isFormValid || this.isLoggingIn) {
      return
    }

    this.isLoggingIn = true

    // Simular llamada a API
    setTimeout(() => {
      this.isLoggingIn = false

      // Simular éxito
      const success = true

      if (success) {
        this.toastType = "success"
        this.toastMessage = "¡Bienvenido a ManaStaff!"
        this.showToast = true

        setTimeout(() => {
          this.showToast = false
          // Redirigir a la página principal después del login
          this.router.navigateByUrl("/inicioavisos")
        }, 1500)
      } else {
        this.showError("Credenciales incorrectas. Intenta nuevamente.")
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

  // Ir a recuperar contraseña
  goToRecoverPassword() {
    this.router.navigateByUrl("/recuperarcontra")
  }

  // Volver a la vista inicial
  goBack() {
    this.showLoginForm = false
    this.email = ""
    this.password = ""
    this.showPassword = false
  }
}
