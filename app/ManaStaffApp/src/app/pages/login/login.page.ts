import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router"
import { AuthService } from 'src/app/services/auth-service';

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

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

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
      return;
    }

    this.isLoggingIn = true;
    
    this.authService.login(this.email, this.password).subscribe({
      next: (userCredential) => {
        this.isLoggingIn = false;
        
        this.toastType = "success";
        this.toastMessage = "¡Bienvenido a ManaStaff!";
        this.showToast = true;

        setTimeout(() => {
          this.showToast = false;
          this.router.navigateByUrl("/inicioavisos");
        }, 1500);
      },
      error: (err) => {
        this.isLoggingIn = false;
        let errorMessage = "Ocurrió un error desconocido. Intenta nuevamente.";

        if (err.code) {
          errorMessage = this.handleFirebaseError(err.code);
        } else if (err.message) {
          errorMessage = err.message;
        }

        this.showError(errorMessage);
      }
    });
  }

  private handleFirebaseError(errorCode: string): string {
    switch (errorCode) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return "Credenciales incorrectas (Correo o contraseña).";
      case 'auth/invalid-email':
        return "El formato del correo electrónico es inválido.";
      case 'auth/user-disabled':
        return "Tu cuenta ha sido deshabilitada.";
      case 'auth/too-many-requests':
        return "Demasiados intentos fallidos. Intenta más tarde.";
      default:
        console.error("Firebase Auth Error Code:", errorCode);
        return "Error de autenticación inesperado.";
    }
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
