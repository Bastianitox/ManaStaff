import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CambiarpinPageRoutingModule } from './cambiarpin-routing.module';

import { CambiarpinPage } from './cambiarpin.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CambiarpinPageRoutingModule
  ],
  declarations: [CambiarpinPage]
})
export class CambiarpinPageModule {}
