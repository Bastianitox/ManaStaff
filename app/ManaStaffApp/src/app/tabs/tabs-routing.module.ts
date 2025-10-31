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
      {
        path: 'solicitudes/detalle/:id',
        loadChildren: () =>
          import('../pages/detallesoli/detallesoli.module').then(
            m => m.DetallesoliPageModule
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
      {
        path: 'noticias/detalle/:id',
        loadChildren: () =>
          import('../pages/detalleavisos/detalleavisos.module').then(
            m => m.DetalleavisosPageModule
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
        path: 'configuracion/perfil',
        loadChildren: () =>
          import('../pages/inicioperfil/inicioperfil.module').then(
            m => m.InicioperfilPageModule
          )
      },
      {
        path: 'configuracion/cambiar-contrasena',
        loadChildren: () =>
          import('../pages/cambiarcontra/cambiarcontra.module').then(
            m => m.CambiarcontraPageModule
          )
      },
      {
        path: 'configuracion/cambiar-pin',
        loadChildren: () =>
          import('../pages/cambiarpin/cambiarpin.module').then(
            m => m.CambiarpinPageModule
          )
      },
      {
        path: 'configuracion/recuperar-pin',
        loadChildren: () =>
          import('../pages/recuperarpin/recuperarpin.module').then(
            m => m.RecuperarpinPageModule
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
