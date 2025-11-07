import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { get, getDatabase, ref } from 'firebase/database';
import { environment } from 'src/environments/environment';
import { Storage } from '@ionic/storage-angular';
import { Database } from '@angular/fire/database';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private _storage: Storage | null = null;

  private userData: any = null;

  constructor(private db: Database, private storage: Storage) {
    this.init();
  }

  async init() {
    this._storage = await this.storage.create();
  }

  async obtenerDatosUsuario(uid: string) {
    try {
      const uidRef = ref(this.db, `UidToRut/${uid}`);
      const uidSnapshot = await get(uidRef);

      if (!uidSnapshot.exists()) throw new Error("No existe el mapeo UID → RUT.");

      const rut = uidSnapshot.val();

      const userRef = ref(this.db, `Usuario/${rut}`);
      const userSnapshot = await get(userRef);

      if (!userSnapshot.exists()) throw new Error("No existe el usuario con ese RUT.");

      const userData = userSnapshot.val();

      let rolNombre = null;
      if (userData.rol) {
        const rolRef = ref(this.db, `Rol/${userData.rol}`);
        const rolSnapshot = await get(rolRef);
        rolNombre = rolSnapshot.exists() ? rolSnapshot.val().nombre : null;
      }

      let cargoNombre = null;
      if (userData.Cargo) {
        const cargoRef = ref(this.db, `Cargo/${userData.Cargo}`);
        const cargoSnapshot = await get(cargoRef);
        cargoNombre = cargoSnapshot.exists() ? cargoSnapshot.val().Nombre : null;
      }

      const datosCompletos = {
        rut,
        ...userData,
        rolNombre: rolNombre || 'Sin rol',
        cargoNombre: cargoNombre || 'Sin cargo'
      };

      await this._storage?.set('usuario', datosCompletos);

      return datosCompletos;
    } catch (error) {
      console.error("Error al obtener datos del usuario:", error);
      throw error;
    }
  }

  async getUsuarioLocal() {
    return await this._storage?.get('usuario');
  }

  // 🔹 Limpia los datos locales
  async limpiarUsuario() {
    await this._storage?.remove('usuario');
  }
}
