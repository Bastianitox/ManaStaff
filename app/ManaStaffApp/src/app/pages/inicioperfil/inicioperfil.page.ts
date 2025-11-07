import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router"
import { finalize } from 'rxjs';
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

  selectedFile: File | null = null

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

  soloNumeros(event: KeyboardEvent) {
    const char = event.key;
    if (!/[0-9]/.test(char)) {
      event.preventDefault();
    }
  }
  
  onTelefonoInput(event: any) {
    let valor = event.target.value.replace(/[^\d]/g, "");

    if (valor.startsWith("56")) {
      valor = valor.substring(2);
    } else if (valor.startsWith("9") === false && valor.length > 0) {
      valor = "9" + valor;
    }

    valor = valor.substring(0, 9);

    if (valor.length > 0) {
      valor =
        "+56 9" +
        (valor.length > 1 ? " " + valor.substring(1, 5) : "") +
        (valor.length > 5 ? " " + valor.substring(5, 9) : "");
    } else {
      valor = "+56 9";
    }

    this.userData.Telefono = valor.trim();
    this.onFieldChange();
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
      this.selectedFile = file
    }else{
      this.selectedFile = null
    }
  }

  cancelPhoto(){
    this.userData.imagen = this.originalData.imagen
    this.changedPhoto = false
    this.selectedFile = null
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

    const telefono = this.userData.Telefono.trim();
    const direccion = this.userData.Direccion.trim();

    // ======= Validación de teléfono =======
    if (!telefono) {
      this.showErrorToast("El número de celular es obligatorio");
      return;
    } else if (!/^(\+56\s?)?9\s?\d{4}\s?\d{4}$/.test(this.userData.Telefono.trim())) {
      this.showErrorToast("Formato de teléfono inválido (ej: +56 9 1234 5678)");
      return;
    } else if (telefono.length < 12 || telefono.length > 16) {
      this.showErrorToast("El número de celular debe tener entre 12 y 16 caracteres");
      return;
    }

    // ======= Validación de dirección =======
    if (!direccion) {
      this.showErrorToast("La dirección no puede estar vacía");
      return;
    } else if (direccion.length < 5) {
      this.showErrorToast("La dirección debe tener al menos 5 caracteres");
      return;
    } else if (direccion.length > 150) {
      this.showErrorToast("La dirección no puede superar los 150 caracteres");
      return;
    } else if (!/^[a-zA-Z0-9\sáéíóúÁÉÍÓÚñÑ#.,-]+$/.test(direccion)) {
      this.showErrorToast("La dirección contiene caracteres inválidos");
      return;
    }

    // Simular guardado
    this.isSaving = true

    const formData = new FormData();
    formData.append('celular', this.userData.Telefono);
    formData.append('direccion', this.userData.Direccion);
    
    if (this.selectedFile) {
      formData.append('imagen', this.selectedFile, this.selectedFile.name);
    }

    this.usuarioService.actualizarPerfil(formData)
      .pipe(finalize(() => {
        this.isSaving = false;
      }))
      .subscribe({
        next: async (response) => {
          try {
            await this.usuarioService.actualizarUsuarioLocal({
              Telefono: this.userData.Telefono,
              Direccion: this.userData.Direccion,
              imagen: this.userData.imagen
            });

            this.originalData = { ...this.userData };
            this.hasChanges = false;
            this.changedPhoto = false;

            this.showSuccessToast("Cambios guardados correctamente");
          } catch (error) {
            console.error("Error al actualizar usuario local:", error);
          }
        },
        error: (httpError) => {
          const errorMessage = httpError.error?.error || httpError.error?.message || "Error desconocido al enviar la solicitud.";
          this.showErrorToast(errorMessage);
        }
      });
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