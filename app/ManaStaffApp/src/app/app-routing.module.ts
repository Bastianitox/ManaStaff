import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { authPrivateGuard } from './core/guards/auth-private-guard';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./pages/login/login.module').then( m => m.LoginPageModule),
    canActivate: [authGuard]
  },
  {
    path: 'recuperarcontra',
    loadChildren: () => import('./pages/recuperarcontra/recuperarcontra.module').then( m => m.RecuperarcontraPageModule),
    canActivate: [authGuard]
  },
  {
    path: 'iniciodoc',
    loadChildren: () => import('./pages/iniciodoc/iniciodoc.module').then( m => m.IniciodocPageModule),
    canActivate: [authPrivateGuard]
  },
  {
    path: 'verdoc',
    loadChildren: () => import('./pages/verdoc/verdoc.module').then( m => m.VerdocPageModule),
    canActivate: [authPrivateGuard]
  },
  {
    path: 'iniciosoli',
    loadChildren: () => import('./pages/iniciosoli/iniciosoli.module').then( m => m.IniciosoliPageModule),
    canActivate: [authPrivateGuard]
  },
  {
    path: 'crearsoli',
    loadChildren: () => import('./pages/crearsoli/crearsoli.module').then( m => m.CrearsoliPageModule),
    canActivate: [authPrivateGuard]
  },
  {
    path: 'detallesoli/:id',
    loadChildren: () => import('./pages/detallesoli/detallesoli.module').then( m => m.DetallesoliPageModule),
    canActivate: [authPrivateGuard]
  },
  {
    path: 'inicioavisos',
    loadChildren: () => import('./pages/inicioavisos/inicioavisos.module').then( m => m.InicioavisosPageModule),
    canActivate: [authPrivateGuard]
  },
  {
    path: 'detalleavisos',
    loadChildren: () => import('./pages/detalleavisos/detalleavisos.module').then( m => m.DetalleavisosPageModule),
    canActivate: [authPrivateGuard]
  },
  {
    path: 'inicioperfil',
    loadChildren: () => import('./pages/inicioperfil/inicioperfil.module').then( m => m.InicioperfilPageModule),
    canActivate: [authPrivateGuard]
  },
  {
    path: 'configuracion',
    loadChildren: () => import('./pages/configuracion/configuracion.module').then( m => m.ConfiguracionPageModule),
    canActivate: [authPrivateGuard]
  },
  {
    path: 'cambiarcontra',
    loadChildren: () => import('./pages/cambiarcontra/cambiarcontra.module').then( m => m.CambiarcontraPageModule),
    canActivate: [authPrivateGuard]
  },
  {
    path: 'cambiarpin',
    loadChildren: () => import('./pages/cambiarpin/cambiarpin.module').then( m => m.CambiarpinPageModule),
    canActivate: [authPrivateGuard]
  },
  {
    path: 'recuperarpin',
    loadChildren: () => import('./pages/recuperarpin/recuperarpin.module').then( m => m.RecuperarpinPageModule),
    canActivate: [authPrivateGuard]
  },
  {
    path: 'tabs',
    loadChildren: () => import('./tabs/tabs.module').then( m => m.TabsPageModule),
    canActivate: [authPrivateGuard]
  }




];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
