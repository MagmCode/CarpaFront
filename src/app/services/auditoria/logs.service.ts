import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError, tap } from 'rxjs';
import { environment } from 'src/environments/environment';


@Injectable({
  providedIn: 'root'
})
export class LogsService {
  constructor(private http: HttpClient) {}

  private apiUrl: string = environment.Url;

  obtenerLogs(fecha: string, nombreAplicacion: string, tipoLog: string): Observable<any> {
    const url = `${this.apiUrl}/logs`;
    const body = {
      fecha,
      nombreAplicacion,
      tipoLog
    };
    return this.http.post(url, body).pipe(
      tap((response) => console.log('Logs obtenidos:', response)),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Error en la solicitud HTTP:', error);
    return throwError('Ocurrió un error en la solicitud. Inténtalo de nuevo más tarde.');
  }
}
