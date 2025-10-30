import { Component, type OnInit } from "@angular/core"
import { AlertController } from "@ionic/angular"
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser"
import { Router } from '@angular/router'

// Interfaz para el detalle del documento
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
    id: "1",
    title: "Contrato de Servicios 2024",
    format: "PDF",
    size: "2.4 MB",
    date: "2024-06-20",
    fileUrl: "assets/sample.pdf",
    downloadUrl: "assets/sample.pdf",
  }

  safeFileUrl: SafeResourceUrl | null = null

  constructor(
    private alertController: AlertController,
    private sanitizer: DomSanitizer,
    private router: Router
  ) {}

  ngOnInit() {
    // Intentar recibir el documento enviado desde la otra página
    const nav = this.router.getCurrentNavigation()
    const passedDoc = nav?.extras?.state?.['document']

    if (passedDoc) {
      console.log("[verdoc] Documento recibido:", passedDoc)
      this.doc = {
        id: passedDoc.id || '0',
        title: passedDoc.name || 'Documento sin título',
        format: passedDoc.type || 'PDF',
        size: passedDoc.size || '0 MB',
        date: passedDoc.date || '',
        fileUrl: 'assets/sample.pdf', 
        downloadUrl: 'assets/sample.pdf',
      }
    }

    // Generar URL segura para iframe
    if (this.doc.fileUrl) {
      this.safeFileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.doc.fileUrl)
    } else {
      this.safeFileUrl = null
    }
  }

  // Volver a la lista "Mis documentos"
  goBack() {
    console.log("[verdoc] Volver a Mis documentos (goBack)")
    this.router.navigate(['/iniciodoc'])
  }

  // Función para volver a la lista de documentos
  goBackToList() {
    console.log("[verdoc] Volver a Mis documentos (goBackToList)")
    this.router.navigate(['/iniciodoc'])
  }

  async downloadDocument() {
    console.log("[verdoc] Descargar:", this.doc.title)

    const alert = await this.alertController.create({
      header: "Descarga iniciada",
      message: `Se está descargando el documento "${this.doc.title}"`,
      buttons: ["OK"],
    })

    await alert.present()
  }

  goToDocumentos() {
    console.log("[verdoc] Navegar a Mis documentos (bottom nav)")
    this.router.navigate(['/iniciodoc'])
  }

  goToNoticias() {
    console.log("[verdoc] Navegar a Noticias y avisos")
    this.router.navigateByUrl("/inicioavisos")
  }

  goToSolicitudes() {
    console.log("Navegar a Solicitudes")
    this.router.navigate(["/iniciosoli"])
  }

  goToConfig() {
    console.log("[verdoc] Navegar a Configuración")
  }
}