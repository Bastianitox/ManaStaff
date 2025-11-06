import { Injectable } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { AlertController, Platform, ToastController } from '@ionic/angular';
import { DocumentosApi } from './documentos-api';
import { HttpClient, HttpEventType, HttpResponse } from '@angular/common/http';
import { Directory, Filesystem, FilesystemEncoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { FileOpener } from '@capacitor-community/file-opener';
import { Utils } from './utils';

@Injectable({
  providedIn: 'root'
})
export class Download {

  activeDownloads: { [id: string]: number } = {};

  constructor(
    private alertController: AlertController,
    private documentosApi: DocumentosApi,
    private platform: Platform,
    private utils: Utils) {

    this.listenForNotificationAction();
  }

  // --------------------------------------------- HELPERS ---------------------------------------------
  

  
  
  private generateNotificationId(str: string): number {
    let hash = 0;
    if (str.length === 0) return 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return Math.abs(hash); 
  }

  private convertBlobToBase64(blob: Blob): Promise<string | ArrayBuffer | null> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  }

  // --------------------------------------------- FIN HELPERS ---------------------------------------------
  async downloadAndSaveDocument(id_doc: string, nombre_archivo: string): Promise<void> {
    
    if (this.activeDownloads[id_doc]) {
        this.utils.showToast('La descarga ya está en progreso.', 'primary');
        return;
    }
    
    const notificationId = this.generateNotificationId(id_doc);
    this.activeDownloads[id_doc] = 0;
    this.utils.showToast(`Iniciando descarga de: ${nombre_archivo}... (0%)`, 'primary');

    try {
        const event$ = this.documentosApi.descargarDocumento(id_doc);
        
        await new Promise<void>((resolve, reject) => {
            event$.subscribe({
                next: async (event) => {
                    if (event.type === HttpEventType.DownloadProgress) {
                        const percent = Math.round((100 * event.loaded) / (event.total || event.loaded));
                        this.activeDownloads[id_doc] = percent;
                        this.utils.showToast(`Descargando: ${nombre_archivo}... (${percent}%)`, 'primary');

                        if (this.platform.is('hybrid')) {
                            this.showNativeNotification(
                                `Descargando: ${nombre_archivo}`,
                                `Progreso: ${percent}%`,
                                notificationId, 
                                true
                            );
                        }
                    } else if (event instanceof HttpResponse) {
                        const blob = event.body as Blob;
                        if (this.platform.is('hybrid')) {
                            await this.guardarArchivoEnDispositivo(blob, nombre_archivo, notificationId);
                        } else {
                            this.descargarEnNavegador(blob, nombre_archivo);
                            this.utils.showToast(`Archivo "${nombre_archivo}" descargado.`, 'success');
                        }
                        resolve();
                    }
                },
                error: (err) => reject(err),
                complete: () => {}
            });
        });

    } catch (err) {
        console.error('Error durante la descarga o guardado:', err);
        if (this.platform.is('hybrid')) {
            this.showNativeNotification('Descarga Fallida ❌', `Error al descargar ${nombre_archivo}.`, notificationId, false);
        } else {
            this.utils.showToast('Error al descargar el documento. Inténtelo de nuevo.', 'danger');
        }
    } finally {
        delete this.activeDownloads[id_doc];
    }
  }

  async cargarPdfDesdeUrl(url: string, id_doc: string) {
    if (!url) return undefined;
    
    this.utils.showToast('Iniciando carga local del documento...', 'primary');

    try {
      const pdfBlob = await this.documentosApi.descargarDocumentoComoBlob(id_doc);

      if (!pdfBlob){
        return undefined
      }
      
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(pdfBlob);
      });

      const base64Content = base64Data.split(',')[1];

      await Filesystem.writeFile({
        path: 'temp_viewer_pdf.pdf',
        data: base64Content, 
        directory: Directory.Cache,
        encoding: (FilesystemEncoding as any).Base64 || 'base64'
      });

      const readResult = await Filesystem.readFile({
        path: 'temp_viewer_pdf.pdf',
        directory: Directory.Cache,
        encoding: (FilesystemEncoding as any).Base64 || 'base64'
      });
      
      const raw = window.atob(readResult.data as string); 
      const rawLength = raw.length;
      const array = new Uint8Array(new ArrayBuffer(rawLength));

      for(let i = 0; i < rawLength; i++) {
        array[i] = raw.charCodeAt(i);
      }
      
      this.utils.showToast('PDF cargado con éxito en el visor interno.', 'success');
      
      // await Filesystem.deleteFile({ path: 'temp_viewer_pdf.pdf', directory: Directory.Cache });

      return array
    } catch (error) {
      console.error('Error al descargar y cargar PDF localmente:', error);
      this.utils.showAlert('Error de Carga Local', 
        'No se pudo descargar o mostrar el PDF internamente. Intenta la descarga normal.'
      );
      return undefined
    }
  }

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

  private async guardarArchivoEnDispositivo(blob: Blob, nombre: string, notificationId: number) {
    const mime = blob.type;
    let extension = '';

    if (mime.includes('pdf')) extension = '.pdf';
    else if (mime.includes('msword')) extension = '.doc';
    else if (mime.includes('wordprocessingml')) extension = '.docx';
    else if (mime.includes('image/jpeg')) extension = '.jpg';
    else if (mime.includes('image/png')) extension = '.png';

    if (extension && !nombre.toLowerCase().endsWith(extension)) {
      nombre += extension;
    }

    const base64Data = await this.convertBlobToBase64(blob) as string;
    let filePath: string | undefined;

    try {
      const result = await Filesystem.writeFile({
        path: `Download/${nombre}`,
        data: base64Data.split(',')[1],
        directory: Directory.ExternalStorage,
      });

      filePath = result.uri;

      
      this.showNativeNotification(
        'Descarga Finalizada', 
        `El archivo "${nombre}" ha sido guardado. Toca para abrir.`, 
        notificationId, 
        false,
        filePath,
        mime
      );
      this.utils.showToast(`✅ Archivo "${nombre}" guardado correctamente en la carpeta Descargas.`, 'success');

    } catch (error) {
      console.error('Error al guardar el archivo:', error);
      this.showNativeNotification(
        'Error de Guardado ❌', 
        `No se pudo guardar "${nombre}". Verifique los permisos.`, 
        notificationId, 
        false
      );
      this.utils.showToast('❌ No se pudo guardar el archivo. Verifica los permisos de almacenamiento.', 'danger'); 
    }
  }

  
  // --------------------------------------------- LOGICA NOTIFICACIONES ---------------------------------------------

  private async showNativeNotification(title: string, body: string, id_doc: number, isProgress: boolean = false, filePath?: string, mimeType?: string) {
    if (!this.platform.is('hybrid')) {
      return; 
    }
    
    const permission = await LocalNotifications.checkPermissions();

    if (permission.display !== 'granted') {
      const request = await LocalNotifications.requestPermissions();
      if (request.display !== 'granted') {
        console.warn('Permiso de notificación nativa denegado.');
        return;
      }
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          title: title,
          body: body,
          id: id_doc,
          ongoing: isProgress,
          sound: isProgress ? undefined : 'default',
          smallIcon: isProgress ? 'res://ic_stat_downloading' : 'res://ic_stat_download_complete',
          actionTypeId: 'fileOpener',
          extra: {
            filePath: filePath,
            mimeType: mimeType,
          }
        },
      ],
    });
  }

  private listenForNotificationAction() {
    if (this.platform.is('hybrid')) {
      LocalNotifications.addListener('localNotificationActionPerformed', async (notificationAction) => {
        console.log('Notification performed action:', notificationAction);
        
        const extraData = notificationAction.notification.extra;
        if (extraData && extraData.filePath && extraData.mimeType) {
          this.openFile(extraData.filePath, extraData.mimeType);
        } else {
          console.warn('Se hizo clic en la notificación, pero no se encontró la ruta/tipo MIME del archivo.');
        }
      });
    }
  }
  
  async openFile(filePath: string, mimeType: string) {
    if (Capacitor.isNativePlatform()) {
      try {
        await FileOpener.open({
          filePath: filePath,
          contentType: mimeType,
        });
      } catch (e) {
        console.error('Error al intentar abrir el archivo:', e);
        this.alertController.create({
          header: 'Error al Abrir',
          message: 'No se pudo abrir el archivo. Asegúrate de tener una aplicación compatible instalada.',
          buttons: ['OK']
        }).then(alert => alert.present());
      }
    } else {
      console.log('File opener is not available on the web.');
    }
  }

}
