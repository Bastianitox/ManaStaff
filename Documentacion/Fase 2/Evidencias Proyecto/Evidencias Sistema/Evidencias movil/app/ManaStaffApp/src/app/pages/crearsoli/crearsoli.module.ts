import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CrearsoliPageRoutingModule } from './crearsoli-routing.module';

import { CrearsoliPage } from './crearsoli.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CrearsoliPageRoutingModule
  ],
  declarations: [CrearsoliPage]
})
export class CrearsoliPageModule {}
