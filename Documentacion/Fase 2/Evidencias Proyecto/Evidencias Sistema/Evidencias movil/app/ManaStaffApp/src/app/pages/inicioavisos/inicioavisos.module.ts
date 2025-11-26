import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { InicioavisosPageRoutingModule } from './inicioavisos-routing.module';

import { InicioavisosPage } from './inicioavisos.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    InicioavisosPageRoutingModule
  ],
  declarations: [InicioavisosPage]
})
export class InicioavisosPageModule {}
