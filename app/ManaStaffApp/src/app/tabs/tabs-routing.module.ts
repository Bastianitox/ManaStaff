import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      //Documentos
      {
        path: 'documentos',
        loadChildren: () =>
          import('../pages/iniciodoc/iniciodoc.module').then(
            m => m.IniciodocPageModule
          )
      },
      {
        path: 'documentos/ver',
        loadChildren: () =>
          import('../pages/verdoc/verdoc.module').then(m => m.VerdocPageModule)
      },
      //Solicitudes
      {
        path: 'solicitudes',
        loadChildren: () =>
          import('../pages/iniciosoli/iniciosoli.module').then(
            m => m.IniciosoliPageModule
          )
      },
      {
        path: 'solicitudes/crear',
        loadChildren: () =>
          import('../pages/crearsoli/crearsoli.module').then(
            m => m.CrearsoliPageModule
          )
      },
      //Noticias
      {
        path: 'noticias',
        loadChildren: () =>
          import('../pages/inicioavisos/inicioavisos.module').then(
            m => m.InicioavisosPageModule
          )
      },
      //Configuración
      {
        path: 'configuracion',
        loadChildren: () =>
          import('../pages/configuracion/configuracion.module').then(
            m => m.ConfiguracionPageModule
          )
      },
      {
        path: '',
        redirectTo: 'documentos',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TabsPageRoutingModule {}
