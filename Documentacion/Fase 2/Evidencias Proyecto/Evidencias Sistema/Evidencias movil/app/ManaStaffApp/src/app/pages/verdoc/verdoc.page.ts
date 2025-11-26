import { Component, type OnInit } from "@angular/core"
import { AlertController, Platform } from "@ionic/angular"
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser"
import { Router } from '@angular/router'
import { HttpClient } from '@angular/common/http';
import { Download } from "src/app/services/download";
import { Directory, Filesystem, FilesystemEncoding } from "@capacitor/filesystem";

interface DocumentoDetalle {
  id: string
  title: string
  format: string
  size: string
  date: string
  fileUrl: string | SafeResourceUrl | null
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

  pdfSrc?: string | Uint8Array;
  safeFileUrl?: SafeResourceUrl;
  isLoading: boolean = false
  errorMessage: string | null = null

  constructor(
    private alertController: AlertController,
    private router: Router,
    private downloadService: Download,
    private domSanitizer: DomSanitizer,
    private http: HttpClient,
  ) {

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
        fileUrl: passedDoc.url, 
        downloadUrl: passedDoc.url || '',
      }

      if (this.doc.format === 'PDF' && this.doc.fileUrl) {
        this.iniciarCargaPdfLocal(this.doc.fileUrl as string, this.doc.id); 
      } else {
        this.isLoading = false;
      }
      
    } else {
      this.isLoading = false
      this.errorMessage = "No se ha recibido el ID del documento para su visualización. Vuelve a Mis documentos."
      this.doc.title = "Error de navegación"
    }
  }

  async iniciarCargaPdfLocal(url: string, id_doc: string) {
    this.isLoading = true;
    try {
      const arrayBuffer = await this.downloadService.cargarPdfDesdeUrl(url, id_doc);

      if (arrayBuffer) {
        this.pdfSrc = arrayBuffer; 
      } else {
        this.errorMessage = 'No se pudo cargar el PDF localmente.';
      }
    } catch (error) {
      this.errorMessage = 'Ocurrió un error al intentar cargar el documento.';
      console.error(error);
    } finally {
      this.isLoading = false;
    }
 }
  

  ngOnInit() {}

  // -------------------------------------------------- DESCARGA --------------------------------------------------
  async descargarDocumento(id_doc: string, nombre_archivo: string) {
    await this.downloadService.downloadAndSaveDocument(id_doc, nombre_archivo);
  }
  
  // -------------------------------------------------- FIN DESCARGA --------------------------------------------------

  pdfCargado(event: any){}




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
