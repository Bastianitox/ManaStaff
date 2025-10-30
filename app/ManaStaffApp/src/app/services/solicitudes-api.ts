import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Define la estructura de la respuesta de tu API de Django
interface ApiResponse {
  status: string; // "success" o "error"
  message: string;
  solicitudes: any[]; // Usaremos 'any[]' por ahora, pero lo ideal es mapearlo a tu interfaz Solicitud
}

// ⚠️ AJUSTA ESTA URL BASE A DONDE ESTÉ TU API DE DJANGO
const API_BASE_URL = 'http://127.0.0.1:8000/api/'; 

@Injectable({
  providedIn: 'root'
})
export class SolicitudesApiService {

  constructor(private http: HttpClient) {}

  /**
   * 📲 Obtiene la lista de solicitudes del usuario autenticado desde la API de Django.
   * La autenticación con el token Bearer se añade automáticamente por el Interceptor.
   * * @returns Un Observable con la respuesta de la API.
   */
  obtenerSolicitudes(): Observable<ApiResponse> {
    const url = API_BASE_URL + 'obtener_solicitudes/';
    
    // Tu Interceptor HTTP (AuthTokenInterceptor) añade el header Authorization: Bearer <token>
    // automáticamente aquí. Si el token no está disponible, la API de Django lo rechazará (401).
    return this.http.get<ApiResponse>(url);
  }
}