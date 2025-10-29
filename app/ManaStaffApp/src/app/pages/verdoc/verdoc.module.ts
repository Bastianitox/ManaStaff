import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { VerdocPageRoutingModule } from './verdoc-routing.module';

import { VerdocPage } from './verdoc.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    VerdocPageRoutingModule
  ],
  declarations: [VerdocPage]
})
export class VerdocPageModule {}
