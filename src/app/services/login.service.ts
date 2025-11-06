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
    password: string;
  }): Observable<any> {
    // Cambiar a 'true' para activar el bypass de login
    const BYPASS = false; 
    // const BYPASS = true; 
    // console.log('LoginService: validarUsuario called. BYPASS=', BYPASS);
    if (BYPASS) {
      // BYPASS LOGIN: Retorna usuario simulado
      return new Observable<any>((observer) => {
  const nombre = 'Usuario';
  const apellido = 'Demo';
  // console.log('LoginService: BYPASS active - setting isLoggedin and returning demo user');
  // Use sessionStorage so session is not shared between tabs
  sessionStorage.setItem('isLoggedin', 'true');
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
        tap((response: any) => {
          // If backend returns a token, mark session active here (service centralizes session handling)
            try {
            if (response && response.token) {
              // Use sessionStorage so session state is tab-scoped
              sessionStorage.setItem('isLoggedin', 'true');
            }
          } catch (e) {
            // ignore storage errors
          }
        }),
        catchError((error: HttpErrorResponse) => {
          // console.warn('LoginService: backend login request failed', error);
          return throwError(() => error.error);
        })
      );
    }
  }

  /**
   * Reporta un evento/resultado de login (o mensajes relacionados) al backend.
   * payload expected: { app, code, severity, message, timestamp?, details? }
   */
  reportEvent(payload: { app: string; code: string; severity: string; message: string; timestamp?: string; details?: any }): Observable<any> {
    console.log('LoginService.reportEvent', payload);
    return this.http.post<any>(`${this.apiUrl}/auth/report`, payload).pipe(
      tap((resp: any) => console.log('reportEvent response:', resp)),
      catchError((error: HttpErrorResponse) => {
        return throwError(() => error.error || error);
      })
    );
  }
}
