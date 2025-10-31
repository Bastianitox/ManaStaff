import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  standalone: false
})
export class TabsPage {
  activeTab: 'documentos' | 'solicitudes' | 'noticias' | 'configuracion' = 'documentos';
  pageTitle = 'Mis documentos';

  // cuál header mostrar
  isDetailHeader = false;

  constructor(private router: Router) {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        const url = event.url;

        // detalle de documento
        if (url.includes('/tabs/documentos/ver')) {
          this.isDetailHeader = true;
          this.activeTab = 'documentos';
          this.pageTitle = 'Detalle del documento';
          return;
        }

        // nueva solicitud
        if (url.includes('/tabs/solicitudes/crear')) {
          this.isDetailHeader = true;
          this.activeTab = 'solicitudes';
          this.pageTitle = 'Nueva solicitud';
          return;
        }

        // detalle de solicitud
        if (url.includes('/tabs/solicitudes/detalle/')) {
          this.isDetailHeader = true;
          this.activeTab = 'solicitudes';
          this.pageTitle = 'Detalle de la solicitud';
          return;
        }

        // detalle noticia/aviso
        if (url.includes('/tabs/noticias/detalle/')) {
          this.isDetailHeader = true;
          this.activeTab = 'noticias';
          this.pageTitle = 'Detalle de publicación';
          return;
        }

        // perfil
        if (url.includes('/tabs/configuracion/perfil')) {
          this.isDetailHeader = true;
          this.activeTab = 'configuracion';
          this.pageTitle = 'Mi perfil';
          return;
        }

        // cambiar contraseña
        if (url.includes('/tabs/configuracion/cambiar-contrasena')) {
          this.isDetailHeader = true;
          this.activeTab = 'configuracion';
          this.pageTitle = 'Cambiar contraseña';
          return;
        }

        // cambiar pin
        if (url.includes('/tabs/configuracion/cambiar-pin')) {
          this.isDetailHeader = true;
          this.activeTab = 'configuracion';
          this.pageTitle = 'Cambiar PIN';
          return;
        }

        // recuperar pin
        if (url.includes('/tabs/configuracion/recuperar-pin')) {
          this.isDetailHeader = true;
          this.activeTab = 'configuracion';
          this.pageTitle = 'Recuperar PIN';
          return;
        }

        // listas (header con logo)
        this.isDetailHeader = false;

        if (url.includes('/tabs/documentos')) {
          this.activeTab = 'documentos';
          this.pageTitle = 'Mis documentos';
        } else if (url.includes('/tabs/solicitudes')) {
          this.activeTab = 'solicitudes';
          this.pageTitle = 'Mis solicitudes';
        } else if (url.includes('/tabs/noticias')) {
          this.activeTab = 'noticias';
          this.pageTitle = 'Noticias y avisos';
        } else if (url.includes('/tabs/configuracion')) {
          this.activeTab = 'configuracion';
          this.pageTitle = 'Configuración';
        }
      });
  }

  goTo(path: string) {
    this.router.navigate(['/tabs', path]);
  }

  goBack() {
    const current = this.router.url;

    // direcciona a configuración
    if (
      current.includes('/tabs/configuracion/perfil') ||
      current.includes('/tabs/configuracion/cambiar-contrasena') ||
      current.includes('/tabs/configuracion/cambiar-pin') ||
      current.includes('/tabs/configuracion/recuperar-pin')
    ) {
      this.router.navigate(['/tabs/configuracion']);
      return;
    }

    // detalle noticia a listado de noticias
    if (current.includes('/tabs/noticias/detalle/')) {
      this.router.navigate(['/tabs/noticias']);
      return;
    }

    // detalle solicitud a listado de solicitudes
    if (current.includes('/tabs/solicitudes/detalle/')) {
      this.router.navigate(['/tabs/solicitudes']);
      return;
    }

    // crear solicitud a listado de solicitudes
    if (current.includes('/tabs/solicitudes/crear')) {
      this.router.navigate(['/tabs/solicitudes']);
      return;
    }

    // ver documento a listado de documentos
    if (current.includes('/tabs/documentos/ver')) {
      this.router.navigate(['/tabs/documentos']);
      return;
    }

    // fallback
    this.router.navigate(['/tabs/documentos']);
  }
}