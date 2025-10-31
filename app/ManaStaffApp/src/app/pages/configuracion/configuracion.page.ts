import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router"

@Component({
  selector: 'app-configuracion',
  templateUrl: './configuracion.page.html',
  styleUrls: ['./configuracion.page.scss'],
  standalone: false
})
export class ConfiguracionPage implements OnInit {
  isDarkMode = false

  constructor(private router: Router) {}

  ngOnInit() {
    // modo oscuro desde localStorage
    const savedDarkMode = localStorage.getItem("darkMode")
    this.isDarkMode = savedDarkMode === "true"
    this.applyDarkMode()
  }

  // Navegación a Mi perfil
  goToPerfil() {
    this.router.navigateByUrl("/inicioperfil")
  }

  // Opciones de seguridad
  cambiarContrasena() {
    console.log("Navegar a cambiar contraseña")
    this.router.navigateByUrl("/cambiarcontra")
  }

  cambiarPIN() {
    console.log("Navegar a cambiar PIN")
    this.router.navigateByUrl("/cambiarpin")
  }

  recuperarPIN() {
    console.log("Navegar a recuperar PIN")
    this.router.navigateByUrl("/recuperarpin")
  }

  // Toggle modo oscuro
  toggleDarkMode() {
    localStorage.setItem("darkMode", this.isDarkMode.toString())
    this.applyDarkMode()
  }

  private applyDarkMode() {
    if (this.isDarkMode) {
      document.body.classList.add("dark")
    } else {
      document.body.classList.remove("dark")
    }
  }

  // Cerrar sesión
  cerrarSesion() {
    console.log("Cerrando sesión...")
    this.router.navigateByUrl("/login")
  }
}