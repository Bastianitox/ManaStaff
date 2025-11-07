import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router"
import { Auth, sendPasswordResetEmail, getAuth } from '@angular/fire/auth';

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

  constructor(
    private router: Router,
    private auth: Auth
  ) {}

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

  async enviarCorreo() {
    if (!this.isFormValid || this.isSending) {
      return
    }

    if (!this.auth) {
        this.showError("Error: El servicio de autenticación no está disponible.");
        return;
    }

    this.isSending = true;

    try {
      await sendPasswordResetEmail(this.auth, this.email.trim());

      this.toastType = "success";
      this.toastMessage = "Link de restablecimiento enviado. Revisa tu correo y carpeta de spam.";
      this.showToast = true;

      setTimeout(() => {
        this.showToast = false;
        this.email = "";
      }, 4000);

    } catch (error: any) {
      console.error("Error al enviar el link:", error);
      
    let errorMessage = "Ocurrió un error inesperado. Intenta de nuevo.";

      switch (error.code) {
        case 'auth/missing-email':
          errorMessage = "Debes ingresar un correo electrónico.";
          break;
        case 'auth/too-many-requests':
          errorMessage = "Demasiadas solicitudes. Intenta más tarde.";
          break;
        default:
          errorMessage = "No se pudo enviar el link debido a un problema técnico. Revisa tu conexión.";
        break;
      }

      this.showError(errorMessage);

    } finally {
      this.isSending = false;
    }
  }

  showError(message: string) {
    this.toastType = "error"
    this.toastMessage = message
    this.showToast = true

    setTimeout(() => {
      this.showToast = false
    }, 3000)
  }

  goToLogin() {
    this.router.navigateByUrl("/login")
  }
}
