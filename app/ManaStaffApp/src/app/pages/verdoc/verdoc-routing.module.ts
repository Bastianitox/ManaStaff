import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { VerdocPage } from './verdoc.page';

const routes: Routes = [
  {
    path: '',
    component: VerdocPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VerdocPageRoutingModule {}
