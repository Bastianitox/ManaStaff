import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

interface ApiResponse {
  status: string;
  message: string;
  solicitudes: any[];
}

interface DetalleApiResponse {
  status: string;
  message: string;
  solicitud: any;
}

interface TiposApiResponse {
  status: string;
  message: string;
  tipos: { id: string; nombre: string }[];
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
    return this.http.post<any>(url, formData);
  }

  obtenerDetalleSolicitud(idSolicitud: string): Observable<DetalleApiResponse> {
    const url = this.API_URL + `detalle_solicitud/${idSolicitud}/`; 
    return this.http.get<DetalleApiResponse>(url);
  }

  obtenerTiposSolicitud(): Observable<TiposApiResponse> {
    const url = this.API_URL + `obtener_tipos_solicitud/`; 
    return this.http.get<TiposApiResponse>(url);
  }

  cancelarSolicitud(id_solicitud: string): Observable<any> {
    const url = this.API_URL + `cancelar_solicitud/${id_solicitud}`; 
    return this.http.delete<any>(url);
  }
}