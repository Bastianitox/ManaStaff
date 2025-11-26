import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CambiarpinPage } from './cambiarpin.page';

const routes: Routes = [
  {
    path: '',
    component: CambiarpinPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CambiarpinPageRoutingModule {}
