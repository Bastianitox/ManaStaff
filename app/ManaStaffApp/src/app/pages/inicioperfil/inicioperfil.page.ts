import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router"
import { UsuarioService } from 'src/app/services/usuario-service';

// Interfaces
interface Usuario {
  id: string
  ApellidoMaterno: string
  ApellidoPaterno: string
  Cargo: string
  Direccion: string
  Fecha_creacion: string
  Nombre: string
  PIN: string
  Segundo_nombre: string
  Telefono: string
  Ultimo_login: string
  correo: string
  imagen: string
  intentos_fallidos: Number
  rol: string
  uid: string
  rolNombre: string
  cargoNombre: string
  rut: string
  nombres: string
  apellidos: string
}

@Component({
  selector: 'app-inicioperfil',
  templateUrl: './inicioperfil.page.html',
  styleUrls: ['./inicioperfil.page.scss'],
  standalone: false
})
export class InicioperfilPage implements OnInit {
  // Datos del usuario
  userData: Usuario = {
    id: "",
    ApellidoMaterno: "",
    ApellidoPaterno: "",
    Cargo: "",
    Direccion: "",
    Fecha_creacion: "",
    Nombre: "",
    PIN: "",
    Segundo_nombre: "",
    Telefono: "",
    Ultimo_login: "",
    correo: "",
    imagen: "",
    intentos_fallidos: 0,
    rol: "",
    uid: "",
    cargoNombre: "",
    rolNombre: "",
    rut: "",
    nombres: "",
    apellidos: ""
  };

  // Datos originales para comparar cambios
  originalData: any = { ...this.userData }

  // Estados
  changedPhoto = false
  hasChanges = false
  isSaving = false
  showToast = false
  toastMessage = ""
  toastType: "success" | "error" | null = null

  constructor(
    private router: Router,
    private usuarioService: UsuarioService
  ) {}

  async ngOnInit() {
    // Guardar datos originales
    this.userData = await this.usuarioService.getUsuarioLocal();

    this.userData.nombres = this.userData.Nombre + " "+ this.userData.Segundo_nombre
    this.userData.apellidos = this.userData.ApellidoPaterno + " "+ this.userData.ApellidoMaterno

    this.originalData = { ...this.userData }
  }

  // Detectar cambios en campos editables
  onFieldChange() {
    this.hasChanges = this.userData.Telefono !== this.originalData.Telefono || this.userData.Direccion !== this.originalData.Direccion || this.userData.imagen !== this.originalData.imagen
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
        this.userData.imagen = e.target.result
        this.onFieldChange()
        this.changedPhoto = true
      }
      reader.readAsDataURL(file)
    }
  }

  cancelPhoto(){
    this.userData.imagen = this.originalData.imagen
    this.changedPhoto = false
    this.onFieldChange()
  }

  // Guardar cambios
  saveChanges() {
    if (!this.hasChanges || this.isSaving) {
      return
    }

    // Validar campos
    if (!this.userData.Telefono.trim()) {
      this.showErrorToast("El celular no puede estar vacío")
      return
    }

    if (!this.userData.Direccion.trim()) {
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