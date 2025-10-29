import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { IniciosoliPage } from './iniciosoli.page';

const routes: Routes = [
  {
    path: '',
    component: IniciosoliPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class IniciosoliPageRoutingModule {}
