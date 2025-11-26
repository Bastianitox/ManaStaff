import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CrearsoliPage } from './crearsoli.page';

const routes: Routes = [
  {
    path: '',
    component: CrearsoliPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CrearsoliPageRoutingModule {}
