import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RecuperarcontraPage } from './recuperarcontra.page';

const routes: Routes = [
  {
    path: '',
    component: RecuperarcontraPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RecuperarcontraPageRoutingModule {}
