import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

// Define la estructura de la respuesta de tu API de Django
interface ApiResponse {
  status: string; // "success" o "error"
  message: string;
  solicitudes: any[]; // Usaremos 'any[]' por ahora, pero lo ideal es mapearlo a tu interfaz Solicitud
}

@Injectable({
  providedIn: 'root'
})
export class SolicitudesApiService {
  private API_URL = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  /**
   * 📲 Obtiene la lista de solicitudes del usuario autenticado desde la API de Django.
   * La autenticación con el token Bearer se añade automáticamente por el Interceptor.
   * * @returns Un Observable con la respuesta de la API.
   */
  obtenerSolicitudes(): Observable<ApiResponse> {
    const url = this.API_URL + 'obtener_solicitudes/';
    return this.http.get<ApiResponse>(url);
  }

  crearSolicitud(formData: FormData): Observable<any> {
    const url = this.API_URL + 'crear_solicitud/';
    
    // HttpClient detecta automáticamente que es FormData y establece el header correcto.
    // El AuthTokenInterceptor se encarga de añadir el token Bearer.
    return this.http.post<any>(url, formData);
  }
}