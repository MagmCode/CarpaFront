import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError, tap } from 'rxjs';
import { environment } from 'src/environments/environment';


@Injectable({
  providedIn: 'root'
})
export class ReportesService {
  constructor(private http: HttpClient) {}

  private apiUrl: string = environment.Url;

  obtenerReportes(siglasApplic: string): Observable<any> {
    const url = `${this.apiUrl}/admin/app/report`;
    const body = {
      siglasApplic,
    };
    return this.http.post(url, body).pipe(
      tap((response) => console.log('Reportes obtenidos:', response)),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Error en la solicitud HTTP:', error);
    return throwError('Ocurrió un error en la solicitud. Inténtalo de nuevo más tarde.');
  }
}
