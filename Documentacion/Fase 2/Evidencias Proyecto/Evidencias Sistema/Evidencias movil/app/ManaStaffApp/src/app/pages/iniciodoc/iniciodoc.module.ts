import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { IniciodocPageRoutingModule } from './iniciodoc-routing.module';

import { IniciodocPage } from './iniciodoc.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    IniciodocPageRoutingModule
  ],
  declarations: [IniciodocPage]
})
export class IniciodocPageModule {}
