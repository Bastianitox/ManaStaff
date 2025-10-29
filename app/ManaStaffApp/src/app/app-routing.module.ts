import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule)
  },
  {
    path: 'ejemplo',
    loadChildren: () => import('./pages/ejemplo/ejemplo.module').then( m => m.EjemploPageModule)
  },  {
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
  }



];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
