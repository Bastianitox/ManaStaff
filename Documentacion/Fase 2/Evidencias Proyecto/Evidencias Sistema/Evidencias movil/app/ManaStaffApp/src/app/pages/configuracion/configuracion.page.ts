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
  isDarkMode = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const savedDarkMode = localStorage.getItem("darkMode");
    this.isDarkMode = savedDarkMode === "true";
    this.applyDarkMode();
  }

  // 👉 Mi perfil
  goToPerfil() {
    this.router.navigateByUrl("/tabs/configuracion/perfil");
  }

  // 👉 Seguridad
  cambiarContrasena() {
    this.router.navigateByUrl("/tabs/configuracion/cambiar-contrasena");
  }

  cambiarPIN() {
    this.router.navigateByUrl("/tabs/configuracion/cambiar-pin");
  }

  recuperarPIN() {
    this.router.navigateByUrl("/tabs/configuracion/recuperar-pin");
  }

  // 👉 Toggle modo oscuro
  toggleDarkMode() {
    localStorage.setItem("darkMode", this.isDarkMode.toString());
    this.applyDarkMode();
  }

  private applyDarkMode() {
    if (this.isDarkMode) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }

  cerrarSesion() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigateByUrl("/", { replaceUrl: true });
        if ((window as any)['tokenRefreshInterval']) {
          clearInterval((window as any)['tokenRefreshInterval']);
          (window as any)['tokenRefreshInterval'] = null;
        }
      },
      error: () => {
        this.router.navigateByUrl("/", { replaceUrl: true });
      }
    });
  }
}