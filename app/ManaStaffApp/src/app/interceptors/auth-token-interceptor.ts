// src/app/interceptors/auth-token.interceptor.ts

import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../services/auth-service';

@Injectable()
export class AuthTokenInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    
    return this.authService.idToken$.pipe(
      filter(token => !!token), 
      take(1),
      switchMap(token => {
        
        const clonedRequest = request.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
        
        return next.handle(clonedRequest);
      })
    );
  }
}