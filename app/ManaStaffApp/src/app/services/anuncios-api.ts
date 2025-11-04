import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

interface ApiResponse {
  status: string;
  message: string;
  anuncios: any[];
}

interface DetalleApiResponse {
  status: string;
  message: string;
  publicacion: any;
}

@Injectable({
  providedIn: 'root'
})
export class AnunciosApi {
  private API_URL = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}
  
  obtenerPublicaciones(): Observable<ApiResponse> {
    const url = this.API_URL + 'obtener_publicacion/';
    return this.http.get<ApiResponse>(url);
  }

  obtenerDetallePublicacion(idPublicacion: string): Observable<DetalleApiResponse> {
    const url = this.API_URL + `detalle_publicacion/${idPublicacion}/`; 
    return this.http.get<DetalleApiResponse>(url);
  }
}
