import { Injectable } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class Utils {

  constructor(
    private alertController: AlertController,
    private toastController: ToastController) {
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: ["OK"],
    })
    await alert.present()
  }

  async showToast(message: string, color: 'primary' | 'success' | 'danger' = 'primary') {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      position: 'bottom',
      color: color === 'success' ? 'success' : (color === 'danger' ? 'danger' : 'primary'),
      buttons: [{
        text: 'Cerrar',
        role: 'cancel'
      }]
    });
    await toast.present();
  }
}
