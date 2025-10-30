import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { InicioperfilPage } from './inicioperfil.page';

const routes: Routes = [
  {
    path: '',
    component: InicioperfilPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InicioperfilPageRoutingModule {}
