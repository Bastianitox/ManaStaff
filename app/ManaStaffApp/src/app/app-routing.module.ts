import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./pages/login/login.module').then( m => m.LoginPageModule)
  },
  {
    path: 'ejemplo',
    loadChildren: () => import('./pages/ejemplo/ejemplo.module').then( m => m.EjemploPageModule)
  },
  {
    path: 'iniciodoc',
    loadChildren: () => import('./pages/iniciodoc/iniciodoc.module').then( m => m.IniciodocPageModule)
  },
  {
    path: 'verdoc',
    loadChildren: () => import('./pages/verdoc/verdoc.module').then( m => m.VerdocPageModule)
  },
  {
    path: 'iniciosoli',
    loadChildren: () => import('./pages/iniciosoli/iniciosoli.module').then( m => m.IniciosoliPageModule)
  },
  {
    path: 'crearsoli',
    loadChildren: () => import('./pages/crearsoli/crearsoli.module').then( m => m.CrearsoliPageModule)
  },
  {
    path: 'detallesoli',
    loadChildren: () => import('./pages/detallesoli/detallesoli.module').then( m => m.DetallesoliPageModule)
  },
  {
    path: 'inicioavisos',
    loadChildren: () => import('./pages/inicioavisos/inicioavisos.module').then( m => m.InicioavisosPageModule)
  },
  {
    path: 'detalleavisos',
    loadChildren: () => import('./pages/detalleavisos/detalleavisos.module').then( m => m.DetalleavisosPageModule)
  },
  {
    path: 'inicioperfil',
    loadChildren: () => import('./pages/inicioperfil/inicioperfil.module').then( m => m.InicioperfilPageModule)
  },
  {
    path: 'configuracion',
    loadChildren: () => import('./pages/configuracion/configuracion.module').then( m => m.ConfiguracionPageModule)
  },
  {
    path: 'cambiarcontra',
    loadChildren: () => import('./pages/cambiarcontra/cambiarcontra.module').then( m => m.CambiarcontraPageModule)
  },
  {
    path: 'cambiarpin',
    loadChildren: () => import('./pages/cambiarpin/cambiarpin.module').then( m => m.CambiarpinPageModule)
  },
  {
    path: 'recuperarpin',
    loadChildren: () => import('./pages/recuperarpin/recuperarpin.module').then( m => m.RecuperarpinPageModule)
  },
  {
    path: 'recuperarcontra',
    loadChildren: () => import('./pages/recuperarcontra/recuperarcontra.module').then( m => m.RecuperarcontraPageModule)
  }



];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
