import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router"

interface UserData {
  nombres: string
  apellidos: string
  rut: string
  correo: string
  cargo: string
  rol: string
  celular: string
  direccion: string
}

@Component({
  selector: 'app-inicioperfil',
  templateUrl: './inicioperfil.page.html',
  styleUrls: ['./inicioperfil.page.scss'],
  standalone: false
})
export class InicioperfilPage implements OnInit {
  // Foto de perfil
  profilePhoto = "https://via.placeholder.com/120/2563EB/FFFFFF?text=Usuario"

  // Datos del usuario
  userData: UserData = {
    nombres: "Juan Carlos",
    apellidos: "González Pérez",
    rut: "12.345.678-9",
    correo: "juan.gonzalez@empresa.cl",
    cargo: "Analista de Sistemas",
    rol: "Empleado",
    celular: "+56 9 8765 4321",
    direccion: "Av. Libertador Bernardo O'Higgins 1234, Santiago",
  }

  // Datos originales para comparar cambios
  originalData: UserData = { ...this.userData }

  // Estados
  hasChanges = false
  isSaving = false
  showToast = false
  toastMessage = ""
  toastType: "success" | "error" | null = null

  constructor(private router: Router) {}

  ngOnInit() {
    // Guardar datos originales
    this.originalData = { ...this.userData }
  }

  // Detectar cambios en campos editables
  onFieldChange() {
    this.hasChanges =
      this.userData.celular !== this.originalData.celular || this.userData.direccion !== this.originalData.direccion
  }

  // Cambiar foto de perfil
  onPhotoSelected(event: any) {
    const file = event.target.files[0]
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith("image/")) {
        this.showErrorToast("Por favor selecciona una imagen válida")
        return
      }

      // Validar tamaño (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.showErrorToast("La imagen no debe superar los 5 MB")
        return
      }

      // Leer y mostrar la imagen
      const reader = new FileReader()
      reader.onload = (e: any) => {
        this.profilePhoto = e.target.result
        this.showSuccessToast("Foto actualizada correctamente")
      }
      reader.readAsDataURL(file)
    }
  }

  // Guardar cambios
  saveChanges() {
    if (!this.hasChanges || this.isSaving) {
      return
    }

    // Validar campos
    if (!this.userData.celular.trim()) {
      this.showErrorToast("El celular no puede estar vacío")
      return
    }

    if (!this.userData.direccion.trim()) {
      this.showErrorToast("La dirección no puede estar vacía")
      return
    }

    // Simular guardado
    this.isSaving = true

    setTimeout(() => {
      this.isSaving = false
      this.originalData = { ...this.userData }
      this.hasChanges = false
      this.showSuccessToast("Cambios guardados correctamente")
    }, 1500)
  }

  // Mostrar toast de éxito
  showSuccessToast(message: string) {
    this.toastMessage = message
    this.toastType = "success"
    this.showToast = true

    setTimeout(() => {
      this.showToast = false
    }, 3000)
  }

  // Mostrar toast de error
  showErrorToast(message: string) {
    this.toastMessage = message
    this.toastType = "error"
    this.showToast = true

    setTimeout(() => {
      this.showToast = false
    }, 3000)
  }

  goBack() {
    this.router.navigate(["/tabs/configuracion"])
  }
}