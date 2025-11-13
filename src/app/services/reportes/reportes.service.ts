import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface ExportPayload {
  idApplication: string | number;
  // allow additional optional filters
  [key: string]: any;
}

@Injectable({
  providedIn: 'root',
})
export class ReportesService {
  private apiUrl = environment.Url;

  constructor(private http: HttpClient) {}

  /**
   * Export Usuarios as CSV. Expects payload containing idApplication.
   */
  exportUsuarios(payload: ExportPayload): Observable<Blob> {
    const url = `${this.apiUrl}/admin/users/export/csv`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', Accept: 'text/csv' });
    return this.http.post(url, payload, { headers, responseType: 'blob' }).pipe(catchError(this.handleError));
  }

  /**
   * Export Roles as CSV. Expects payload containing idApplication.
   */
  exportRoles(payload: ExportPayload): Observable<Blob> {
    const url = `${this.apiUrl}/admin/roles/export/csv`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', Accept: 'text/csv' });
    return this.http.post(url, payload, { headers, responseType: 'blob' }).pipe(catchError(this.handleError));
  }

  /**
   * Export Privilegios (acciones) as CSV. Expects payload containing idApplication.
   */
  exportPrivilegios(payload: ExportPayload): Observable<Blob> {
    const url = `${this.apiUrl}/admin/acciones/export/csv`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', Accept: 'text/csv' });
    return this.http.post(url, payload, { headers, responseType: 'blob' }).pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    // Let the component handle the user-facing message; return the raw error
    console.error('ReportesService error', error);
    return throwError(() => (error.error || error.message || error));
  }
}
