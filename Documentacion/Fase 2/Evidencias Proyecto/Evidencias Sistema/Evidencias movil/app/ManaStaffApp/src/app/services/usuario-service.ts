import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { get, getDatabase, ref } from 'firebase/database';
import { environment } from 'src/environments/environment';
import { Storage } from '@ionic/storage-angular';
import { Database } from '@angular/fire/database';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private API_URL = environment.apiBaseUrl;
  private _storage: Storage | null = null;

  public userData: any = null;

  constructor(
    private db: Database, 
    private storage: Storage,
    private http: HttpClient) {
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

      this.userData = datosCompletos

      return datosCompletos;
    } catch (error) {
      console.error("Error al obtener datos del usuario:", error);
      throw error;
    }
  }

  async getUsuarioLocal() {
    return await this._storage?.get('usuario');
  }

  async limpiarUsuario() {
    await this._storage?.remove('usuario');
  }

  async actualizarUsuarioLocal(nuevosDatos: any) {
    const usuarioActual = await this._storage?.get('usuario');
    const usuarioActualizado = { ...usuarioActual, ...nuevosDatos };
    await this._storage?.set('usuario', usuarioActualizado);

    this.userData = usuarioActualizado
    return usuarioActualizado;
  }


  // ----------------------------------------------- FUNCIONES DE USUARIO -----------------------------------------------

  actualizarPerfil(formData: FormData): Observable<any> {
    const url = this.API_URL + 'actualizar_perfil/';
    return this.http.post<any>(url, formData);
  }

  cambiarContrasena(formData: FormData): Observable<any> {
    const url = this.API_URL + 'cambiar_contrasena/';
    return this.http.post<any>(url, formData);
  }

  cambiarPIN(formData: FormData): Observable<any> {
    const url = this.API_URL + 'cambiar_pin/';
    return this.http.post<any>(url, formData);
  }

  enviarCodigo(formData: FormData): Observable<any> {
    const url = this.API_URL + 'solicitar_recuperacion_pin/';
    return this.http.post<any>(url, formData);
  }
  
  verificarCodigo(formData: FormData): Observable<any> {
    const url = this.API_URL + 'verificar_codigo_recuperacion/';
    return this.http.post<any>(url, formData);
  }

  cambiarPINverificado(formData: FormData): Observable<any> {
    const url = this.API_URL + 'cambiar_PIN_verificado/';
    return this.http.post<any>(url, formData);
  }

}
