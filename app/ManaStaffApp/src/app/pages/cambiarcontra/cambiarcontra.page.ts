import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router"
import { finalize } from 'rxjs';
import { UsuarioService } from 'src/app/services/usuario-service';
import { Utils } from 'src/app/services/utils';

@Component({
  selector: 'app-cambiarcontra',
  templateUrl: './cambiarcontra.page.html',
  styleUrls: ['./cambiarcontra.page.scss'],
  standalone: false
})
export class CambiarcontraPage implements OnInit {
  // Campos del formulario
  currentPassword = ""
  newPassword = ""
  confirmPassword = ""

  // Visibilidad de contraseñas
  showCurrentPassword = false
  showNewPassword = false
  showConfirmPassword = false

  // Validaciones
  validations = {
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
    match: false,
  }

  // Estado del formulario
  isFormValid = false
  isSubmitting = false

  // Toast
  showToast = false
  toastType: "success" | "error" = "success"
  toastMessage = ""

  constructor(
    private router: Router,
    private usuarioService: UsuarioService,
    private utils: Utils) {}

  ngOnInit() {}

  // Validar contraseña en tiempo real
  validatePassword() {
    const password = this.newPassword

    // Validar longitud (8-30 caracteres)
    this.validations.length = password.length >= 8 && password.length <= 30

    // Validar mayúscula
    this.validations.uppercase = /[A-Z]/.test(password)

    // Validar minúscula
    this.validations.lowercase = /[a-z]/.test(password)

    // Validar número
    this.validations.number = /[0-9]/.test(password)

    // Validar carácter especial
    this.validations.special = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)

    // Validar coincidencia
    this.validations.match = password.length > 0 && this.confirmPassword.length > 0 && password === this.confirmPassword

    // Verificar validez del formulario
    this.checkFormValidity()
  }

  // Verificar si el formulario es válido
  checkFormValidity() {
    const allValidationsPassed =
      this.validations.length &&
      this.validations.uppercase &&
      this.validations.lowercase &&
      this.validations.number &&
      this.validations.special &&
      this.validations.match

    this.isFormValid = this.currentPassword.length > 0 && allValidationsPassed
  }

  // Cambiar contraseña
  async changePassword() {
    if (!this.isFormValid || this.isSubmitting) {
      return
    }

    const formData = new FormData

    formData.append('password_actual', this.currentPassword)
    formData.append('nueva_password', this.newPassword)
    formData.append('confirmar_password', this.confirmPassword)

    this.isSubmitting = true

    this.usuarioService.cambiarContrasena(formData)
      .pipe(finalize(() => {
        this.isSubmitting = false;
      }))
      .subscribe({
        next: (response) => {
          this.toastType = "success"
          this.toastMessage = "¡Contraseña actualizada correctamente!"
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
        }
      });
  }

  // Resetear formulario
  resetForm() {
    this.currentPassword = ""
    this.newPassword = ""
    this.confirmPassword = ""
    this.showCurrentPassword = false
    this.showNewPassword = false
    this.showConfirmPassword = false
    this.validations = {
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false,
      match: false,
    }
    this.isFormValid = false
  }

  // Navegación
  goBack() {
    this.router.navigateByUrl("/tabs/configuracion")
  }
}