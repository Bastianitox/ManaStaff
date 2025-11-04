import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';


interface ApiResponse {
  status: string;
  message: string;
  documentos: any[];
}

@Injectable({
  providedIn: 'root'
})
export class DocumentosApi {
  private API_URL = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}
  
  obtenerPublicaciones(): Observable<ApiResponse> {
    const url = this.API_URL + 'obtener_documentos/';
    return this.http.get<ApiResponse>(url);
  }

}
