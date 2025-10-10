import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError, tap } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ModificarStatusService {

    private apiUrl: string = environment.Url;

  constructor(private http: HttpClient) { }

  modificarStatus(data:{userId: string, userStatus: number}): Observable <any> {
    return this.http.put<any>(`${this.apiUrl}/admin/users/update`, data).pipe(
        tap((response: any)=> {
            console.log("respuesta de servicio de modificar status", response)
        }), 
        catchError((error: HttpErrorResponse)=> {return throwError(()=>error.error)})
    )
  }
}
