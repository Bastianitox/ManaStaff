import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DetallesoliPage } from './detallesoli.page';

const routes: Routes = [
  {
    path: '',
    component: DetallesoliPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DetallesoliPageRoutingModule {}
