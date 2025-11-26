import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { IniciosoliPageRoutingModule } from './iniciosoli-routing.module';

import { IniciosoliPage } from './iniciosoli.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    IniciosoliPageRoutingModule
  ],
  declarations: [IniciosoliPage]
})
export class IniciosoliPageModule {}
