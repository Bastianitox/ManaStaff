import { Component, type OnInit } from "@angular/core"
import { AlertController, Platform } from "@ionic/angular"
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser"
import { Router } from '@angular/router'
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { DocumentosApi } from "src/app/services/documentos-api";
import { Directory, Filesystem } from '@capacitor/filesystem';

import { Browser } from '@capacitor/browser'; 
import { Download } from "src/app/services/download";

interface DocumentoDetalle {
  id: string
  title: string
  format: string
  size: string
  date: string
  fileUrl: string | null
  downloadUrl: string | null
}

@Component({
  selector: "app-verdoc",
  templateUrl: "./verdoc.page.html",
  styleUrls: ["./verdoc.page.scss"],
  standalone: false
})
export class VerdocPage implements OnInit {
  // Documento actual
  doc: DocumentoDetalle = {
    id: "",
    title: "Cargando...",
    format: "",
    size: "",
    date: "",
    fileUrl: null,
    downloadUrl: null,
  }

  safeFileUrl: SafeResourceUrl | null = null
  isLoading: boolean = false
  errorMessage: string | null = null

  constructor(
    private alertController: AlertController,
    private router: Router,
    private downloadService: Download
  ) {}

  ngOnInit() {
    this.isLoading = true
    
    const nav = this.router.getCurrentNavigation()
    const passedDoc: any = nav?.extras?.state?.['document']

    if (passedDoc && passedDoc.id) {
      
      this.doc = {
        id: passedDoc.id,
        title: passedDoc.nombre || 'Documento sin título',
        format: passedDoc.tipo_documento || 'Archivo', 
        size: passedDoc.tamano_archivo || '0 MB', 
        date: passedDoc.Fecha_emitida || '',
        fileUrl: null, 
        downloadUrl: passedDoc.url || '',
      }
      
    } else {
      this.isLoading = false
      this.errorMessage = "No se ha recibido el ID del documento para su visualización. Vuelve a Mis documentos."
      this.doc.title = "Error de navegación"
    }
  }

  // -------------------------------------------------- DESCARGA --------------------------------------------------
  async descargarDocumento(id_doc: string, nombre_archivo: string) {
    await this.downloadService.downloadAndSaveDocument(id_doc, nombre_archivo);
  }
  
  // -------------------------------------------------- FIN DESCARGA --------------------------------------------------

  async viewDocument() {
    if (!this.doc.fileUrl) {
      this.showAlert("Error", "URL del documento no disponible para previsualización.");
      return;
    }
    
    try {
      await Browser.open({ url: this.doc.fileUrl });
    } catch(e) {
      console.error("Error al abrir el navegador de Capacitor:", e);
      this.showAlert("Error de Visualización", "No se pudo abrir el visor de documentos nativo. Intenta descargar.");
    }
  }




  // -------------------------------------------------- FUNCIONES AYUDA --------------------------------------------------


  private async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
        header: header,
        message: message,
        buttons: ["OK"],
    })
    await alert.present()
  }

  goBack() {
    this.router.navigate(['/tabs/documentos'])
  }

  goBackToList() {
    this.router.navigate(['/tabs/documentos'])
  }
}
