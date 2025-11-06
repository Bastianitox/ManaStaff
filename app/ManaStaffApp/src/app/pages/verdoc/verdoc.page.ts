import { Component, type OnInit } from "@angular/core"
import { AlertController, Platform } from "@ionic/angular"
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser"
import { Router } from '@angular/router'
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { DocumentosApi } from "src/app/services/documentos-api";
import { Directory, Filesystem } from '@capacitor/filesystem';

import { Browser } from '@capacitor/browser'; 

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
    private documentosApi: DocumentosApi,
    private platform: Platform
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


  descargarDocumento(id_doc: string, nombre_archivo: string){}
  // -------------------------------------------------- DESCARGA DE DOCUMENTOS --------------------------------------------------
/*
  async descargarDocumento(id_doc: string, nombre_archivo: string) {
      this.showAlert("Descargando...","Iniciada descarga del archivo "+nombre_archivo);

    this.documentosApi.descargarDocumento(id_doc).subscribe({
      next: async (blob) => {
        if (this.platform.is('hybrid')) {
          // 📱 Modo móvil (Capacitor)
          await this.guardarArchivoEnDispositivo(blob, nombre_archivo);
        } else {
          // 💻 Modo navegador
          this.descargarEnNavegador(blob, nombre_archivo);
        }
      },
      error: (err) => {
        console.error('Error al descargar el documento:', err);
        alert('Error al descargar el documento.');
      }
    });
  }
*/
  private descargarEnNavegador(blob: Blob, nombre: string) {
    const fileUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = nombre || 'documento.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(fileUrl);
  }

  private async guardarArchivoEnDispositivo(blob: Blob, nombre: string) {
    // Detectar extensión desde el tipo MIME
    const mime = blob.type;
    let extension = '';

    if (mime === 'application/pdf') extension = '.pdf';
    else if (mime === 'application/msword') extension = '.doc';
    else if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') extension = '.docx';
    else if (mime === 'image/jpeg') extension = '.jpg';
    else if (mime === 'image/png') extension = '.png';
    else extension = '';

    // Si el nombre no termina con esa extensión, agrégala
    if (extension && !nombre.toLowerCase().endsWith(extension)) {
      nombre += extension;
    }

    const base64Data = await this.convertBlobToBase64(blob) as string;

    try {
      await Filesystem.writeFile({
        path: `Download/${nombre}`,
        data: base64Data.split(',')[1],
        directory: Directory.ExternalStorage,
      });

      alert(`✅ Archivo "${nombre}" guardado correctamente en la carpeta Descargas.`);
    } catch (error) {
      console.error('Error al guardar el archivo:', error);
      alert('❌ No se pudo guardar el archivo. Verifica los permisos de almacenamiento.');
    }
  }

  private convertBlobToBase64(blob: Blob): Promise<string | ArrayBuffer | null> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  }


  // -------------------------------------------------- FIN DESCARGA DE DOCUMENTOS --------------------------------------------------


  
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
