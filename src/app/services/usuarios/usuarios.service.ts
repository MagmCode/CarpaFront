import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError, map, BehaviorSubject, switchMap } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {

    // private apiUrl = 'http://180.183.67.228:8080/api/admin/users/all';
    private apiUrl = environment.Url;
    private usuariosSubject = new BehaviorSubject<any[]>([]);
    usuarios$ = this.usuariosSubject.asObservable();


  constructor(private http: HttpClient) { }

  consultarUsuarios(): Observable<any> {
    const token = localStorage.getItem('token');
    if (token && !isTokenExpired(token)) {
      const headers = new HttpHeaders({ Authorization: `${token}` });
      return this.http.get<any>(`${this.apiUrl}/admin/users/all`, { headers });
    } else {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        return throwError(() => new Error('No refresh token'))
      }
      return this.fetchNewToken(refreshToken).pipe(
        switchMap((newToken: string) => {
          localStorage.setItem('token', newToken);
          const headers = new HttpHeaders({ Authorization: `${newToken}` });
          return this.http.get<any>(`${this.apiUrl}/admin/users/all`, { headers });
        })
      );
    }
  }

  private fetchNewToken(refreshToken: string | null): Observable<string> {
    return this.http.post<{ token: string }>(
      `${this.apiUrl}/auth/refresh`,
      { refreshToken }
    ).pipe(
      map(response => response.token)
    );
  }

  
  // consultarUsuarios(): Observable <any> {
    //   return this.http.get<any>(`${this.apiUrl}/admin/users/all`).pipe(
      //       map((response: any)=> {
        //         console.log('usuarioService:', response);
        //           return response
        //       }), 
        //       catchError((error: HttpErrorResponse)=> {return throwError(()=>error.error)})
        //   )
        // }
        
        setUsuarios(usuarios: any[]) {
          this.usuariosSubject.next(usuarios);
        }
        
        getUsuarios(): any[] {
          return this.usuariosSubject.getValue();
        }
      }
      
      function isTokenExpired(token: string): boolean {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const exp = payload.exp;
          const now = Math.floor(Date.now() / 1000);
          return exp < now;
        } catch {
          return true;
        }
      }