import { Component, type OnInit } from "@angular/core"
import { AlertController } from "@ionic/angular"
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser"
import { Router } from '@angular/router'
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { DocumentosApi } from "src/app/services/documentos-api";


interface DocumentoDetalle {
  id: string
  title: string
  format: string
  size: string
  date: string
  fileUrl: string
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
    fileUrl: "",
    downloadUrl: null,
  }

  safeFileUrl: SafeResourceUrl | null = null
  isLoading: boolean = false
  errorMessage: string | null = null

  constructor(
    private alertController: AlertController,
    private sanitizer: DomSanitizer,
    private router: Router,
    private documentosApi: DocumentosApi,
    private http: HttpClient
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
        fileUrl: passedDoc.url || '', 
        downloadUrl: null,
      }
      
      
      this.safeFileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.doc.fileUrl);

      this.cargarUrlDocumento(this.doc.id)
      
    } else {
      this.isLoading = false
      this.errorMessage = "No se ha recibido el ID del documento para su visualización. Vuelve a Mis documentos."
      this.doc.title = "Error de navegación"
    }
  }

  cargarUrlDocumento(id_doc: string){
    if (!id_doc) {
        this.isLoading = false;
        this.errorMessage = "ID de documento no válido.";
        return;
    }

    this.isLoading = true;
    this.documentosApi.descargarDocumento(id_doc).subscribe({
      next: (response) => {
        this.isLoading = false;
        
        if (response.status === 'success') {
          this.doc.downloadUrl = response.download_url; 
          this.errorMessage = null;
        } else if (response.status === 'error') {
            this.errorMessage = response.message;
        } else {
            this.errorMessage = "La respuesta de la API no fue exitosa o no contenía la URL.";
        }
        
      },
      error: (httpError) => {
        this.isLoading = false;
        
        let message = "Error de conexión con el servidor.";
        if (httpError.status === 401) {
          message = "Su sesión ha expirado o no está autorizado. Inicie sesión nuevamente.";
        } else if (httpError.error && httpError.error.error) {
            message = httpError.error.error;
        }
      }
    })
  }

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

  async downloadDocument() {
    if (!this.doc.downloadUrl) {
      this.showAlert("Error de descarga", "La URL de descarga no está disponible. Intenta refrescar la página.");
      return;
    }
    window.open(this.doc.downloadUrl, '_system');

    this.showAlert("Descarga Iniciada", `Se está descargando el documento "${this.doc.title}".`);
  }
}
