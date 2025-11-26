import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { IniciodocPage } from './iniciodoc.page';

const routes: Routes = [
  {
    path: '',
    component: IniciodocPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class IniciodocPageRoutingModule {}
