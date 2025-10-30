import { Injectable } from '@angular/core';
import { Auth, User, signInWithEmailAndPassword, getIdTokenResult, onAuthStateChanged, signOut } from '@angular/fire/auth';
import { from, Observable, BehaviorSubject } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);
  
  // Observable que emite el token JWT de Firebase
  private idToken: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  public idToken$: Observable<string | null> = this.idToken.asObservable();

  constructor(private auth: Auth) {
    // 1. Monitorear el estado de autenticación de Firebase
    onAuthStateChanged(this.auth, (user) => {
      this.currentUser.next(user);
      if (user) {
        // 2. Obtener el token al iniciar sesión
        this.fetchAndSetToken(user);
        // 3. Configurar el refresco del token (CRUCIAL)
        this.setupTokenRefresh(user);
      } else {
        this.idToken.next(null);
      }
    });
  }

  /**
   * 🔄 Inicia sesión y obtiene el token.
   */
  login(email: string, password: string): Observable<any> {
    const promise = signInWithEmailAndPassword(this.auth, email, password);
    // Usamos 'from' para convertir la promesa en un Observable
    return from(promise); 
  }

  /**
   * 🔓 Cierra la sesión del usuario.
   */
  logout(): Observable<void> {
    return from(signOut(this.auth));
  }
  
  /**
   * 🔑 Obtiene el ID Token de Firebase.
   */
  private async fetchAndSetToken(user: User, forceRefresh: boolean = false) {
    try {
      // Obtener el token (forzando el refresco si es necesario)
      const tokenResult = await user.getIdTokenResult(forceRefresh);
      this.idToken.next(tokenResult.token);
      console.log('Firebase ID Token actualizado:', tokenResult.token.substring(0, 20) + '...');
    } catch (error) {
      console.error('Error al obtener el ID Token:', error);
      this.idToken.next(null);
    }
  }

  /**
   * 🕒 Configura la lógica de refresco del token.
   * El token de Firebase dura 1 hora. Necesitas obtener uno nuevo antes de que expire.
   */
  private setupTokenRefresh(user: User) {
    // Firebase ID Tokens tienen una duración de 3600 segundos (1 hora).
    // Lo refrescaremos 5 minutos (300 segundos) antes de que expire.
    const refreshIntervalSeconds = 3600 - 300; 
    
    // Convertir segundos a milisegundos
    const refreshIntervalMs = refreshIntervalSeconds * 1000; 

    // Limpiar cualquier intervalo anterior si lo hubiera
    if ((window as any)['tokenRefreshInterval']) {
      clearInterval((window as any)['tokenRefreshInterval']);
    }

    // Configurar el nuevo intervalo de refresco
    (window as any)['tokenRefreshInterval'] = setInterval(() => {
        console.log('Forzando refresco del token de Firebase...');
        this.fetchAndSetToken(user, true); // Pasar 'true' para forzar el refresco
    }, refreshIntervalMs);
  }
}
