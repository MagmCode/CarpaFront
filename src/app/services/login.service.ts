import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError, tap } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private apiUrl: string = environment.Url;

  constructor(private http: HttpClient) {}

  validarUsuario(data: {
    codUsuario: string;
    siglasApplic: string;
  }): Observable<any> {
    const BYPASS = true; // Cambiar a 'true' para activar el bypass de login
    if (!BYPASS) {
      return this.http.post<any>(`${this.apiUrl}/auth/login`, data).pipe(
        tap((response: any) => {}),
        catchError((error: HttpErrorResponse) => {
          return throwError(() => error.error);
        })
      );
    } else {
      // BYPASS LOGIN: Retorna usuario simulado
      return new Observable<any>((observer) => {
        const nombre = 'Usuario';
        const apellido = 'Demo';
        observer.next({
          token: 'fake-token',
          refreshToken: 'fake-refresh-token',
          usuario: {
            codUsuario: data.codUsuario,
            nombre,
            apellido,
            roles: ['admin'],
            menus: ['menu1', 'menu2', 'menu3'],
          },
        });
        observer.complete();
      });
    }
  }
}
