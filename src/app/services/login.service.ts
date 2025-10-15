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
    const BYPASS = false; // Cambiar a 'true' para activar el bypass de login
    if (BYPASS) {
      // BYPASS LOGIN: Retorna usuario simulado
      return new Observable<any>((observer) => {
        const nombre = 'Usuario';
        const apellido = 'Demo';
        localStorage.setItem('isLoggedin', 'true');
        observer.next({
          // marcar sesión activa para que AuthGuard permita el acceso
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
    } else {
      return this.http.post<any>(`${this.apiUrl}/auth/login`, data).pipe(
        tap((response: any) => {}),
        catchError((error: HttpErrorResponse) => {
          return throwError(() => error.error);
        })
      );
    }
  }
}
