import { HttpClient, HttpEvent } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';


interface ApiResponse {
  status: string;
  message: string;
  documentos: any[];
}

interface PinApiResponse{
  status: string;
  message: string;
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

  descargarDocumento(id_doc: string): Observable<HttpEvent<Blob>> {
    const url = this.API_URL + `descargar_documento/${id_doc}`;
    return this.http.get(url, { 
      responseType: 'blob',
      reportProgress: true,
      observe: 'events'
    });
  }

  descargarDocumentoComoBlob(id_doc: string): Promise<Blob> {
    const url = this.API_URL + `descargar_documento/${id_doc}`;
    return new Promise((resolve, reject) => {
    this.http.get(url, { 
      responseType: 'blob',
      observe: 'body'
    }).subscribe({
      next: (blob) => resolve(blob),
      error: (err) => reject(err)
    });
    });
  }

  verificarPIN(formData: FormData): Observable<PinApiResponse>{
    const url = this.API_URL + 'verificar_pin/';
    return this.http.post<PinApiResponse>(url, formData);
  }


}
