import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DetalleavisosPageRoutingModule } from './detalleavisos-routing.module';

import { DetalleavisosPage } from './detalleavisos.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DetalleavisosPageRoutingModule
  ],
  declarations: [DetalleavisosPage]
})
export class DetalleavisosPageModule {}
