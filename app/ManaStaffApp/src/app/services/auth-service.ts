import { Injectable } from '@angular/core';
import { Auth, User, signInWithEmailAndPassword, getIdTokenResult, onAuthStateChanged, signOut } from '@angular/fire/auth';
import { from, Observable, BehaviorSubject } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);
  
  private idToken: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  public idToken$: Observable<string | null> = this.idToken.asObservable();

  constructor(private auth: Auth) {
    onAuthStateChanged(this.auth, (user) => {
      this.currentUser.next(user);
      if (user) {
        this.fetchAndSetToken(user);
        this.setupTokenRefresh(user);
      } else {
        this.idToken.next(null);
      }
    });
  }

  // Inicia sesión y obtiene el token.
   
  login(email: string, password: string): Observable<any> {
    const promise = signInWithEmailAndPassword(this.auth, email, password);
    return from(promise); 
  }

  logout(): Observable<void> {
    return from(signOut(this.auth));
  }
  
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

  private setupTokenRefresh(user: User) {
    const refreshIntervalSeconds = 3600 - 300; 
    
    const refreshIntervalMs = refreshIntervalSeconds * 1000; 

    if ((window as any)['tokenRefreshInterval']) {
      clearInterval((window as any)['tokenRefreshInterval']);
    }

    (window as any)['tokenRefreshInterval'] = setInterval(() => {
        console.log('Forzando refresco del token de Firebase...');
        this.fetchAndSetToken(user, true);
    }, refreshIntervalMs);
  }
}
