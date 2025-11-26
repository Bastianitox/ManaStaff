import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { InicioperfilPageRoutingModule } from './inicioperfil-routing.module';

import { InicioperfilPage } from './inicioperfil.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    InicioperfilPageRoutingModule
  ],
  declarations: [InicioperfilPage]
})
export class InicioperfilPageModule {}
