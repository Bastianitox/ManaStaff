import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { VerdocPageRoutingModule } from './verdoc-routing.module';

import { VerdocPage } from './verdoc.page';
import { PdfViewerModule } from 'ng2-pdf-viewer';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    VerdocPageRoutingModule,
    PdfViewerModule
  ],
  declarations: [VerdocPage]
})
export class VerdocPageModule {}
