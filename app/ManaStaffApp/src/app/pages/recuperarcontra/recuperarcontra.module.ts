import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RecuperarcontraPageRoutingModule } from './recuperarcontra-routing.module';

import { RecuperarcontraPage } from './recuperarcontra.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RecuperarcontraPageRoutingModule
  ],
  declarations: [RecuperarcontraPage]
})
export class RecuperarcontraPageModule {}
