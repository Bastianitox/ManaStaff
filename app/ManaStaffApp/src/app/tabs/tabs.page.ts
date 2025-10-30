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

  constructor(private router: Router) {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        if (event.url.includes('/tabs/documentos')) {
          this.activeTab = 'documentos';
          this.pageTitle = 'Mis documentos';
        } else if (event.url.includes('/tabs/solicitudes')) {
          this.activeTab = 'solicitudes';
          this.pageTitle = 'Mis solicitudes';
        } else if (event.url.includes('/tabs/noticias')) {
          this.activeTab = 'noticias';
          this.pageTitle = 'Noticias y avisos';
        } else if (event.url.includes('/tabs/configuracion')) {
          this.activeTab = 'configuracion';
          this.pageTitle = 'Configuración';
        }
      });
  }

  goTo(path: string) {
    this.router.navigate(['/tabs', path]);
  }
}