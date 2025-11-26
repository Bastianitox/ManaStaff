import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { InicioavisosPage } from './inicioavisos.page';

const routes: Routes = [
  {
    path: '',
    component: InicioavisosPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InicioavisosPageRoutingModule {}
