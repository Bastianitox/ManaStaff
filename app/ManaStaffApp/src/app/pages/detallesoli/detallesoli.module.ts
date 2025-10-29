import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DetallesoliPageRoutingModule } from './detallesoli-routing.module';

import { DetallesoliPage } from './detallesoli.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DetallesoliPageRoutingModule
  ],
  declarations: [DetallesoliPage]
})
export class DetallesoliPageModule {}
