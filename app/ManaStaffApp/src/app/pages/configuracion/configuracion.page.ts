import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router"
import { AuthService } from 'src/app/services/auth-service';

@Component({
  selector: 'app-configuracion',
  templateUrl: './configuracion.page.html',
  styleUrls: ['./configuracion.page.scss'],
  standalone: false
})
export class ConfiguracionPage implements OnInit {
  isDarkMode = false

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

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

  cerrarSesion() {
    console.log("Cerrando sesión...")
    
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigateByUrl("/", { replaceUrl: true });
        
        if ((window as any)['tokenRefreshInterval']) {
            clearInterval((window as any)['tokenRefreshInterval']);
            (window as any)['tokenRefreshInterval'] = null;
        }
      },
      error: (e) => {
        console.error("Error al cerrar sesión:", e);
        this.router.navigateByUrl("/", { replaceUrl: true });
      }
    });
  }

  // Navegación
  goToDocumentos() {
    this.router.navigateByUrl("/iniciodoc")
  }

  goToSolicitudes() {
    this.router.navigateByUrl("/iniciosoli")
  }

  goToNoticias() {
    this.router.navigateByUrl("/inicioavisos")
  }

  goToConfig() {
    this.router.navigateByUrl("/configuracion")
  }
}