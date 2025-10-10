import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError, tap } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

    private apiUrl: string = environment.Url;

  constructor(private http: HttpClient) { }

  validarUsuario(data:{codUsuario: string, siglasApplic: string}): Observable <any> {
    return this.http.post<any>(`${this.apiUrl}/auth/login`, data).pipe(
        tap((response: any)=> {

        }), 
        catchError((error: HttpErrorResponse)=> {return throwError(()=>error.error)})
    )
  }
}
