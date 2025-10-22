import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError, tap } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LogoutService {

    private apiUrl: string = environment.Url;

  constructor(private http: HttpClient) { }

  logout(token: string): Observable<any> {
    const headers = { 'Authorization': `${token}` };
    return this.http.post<any>(`${this.apiUrl}/auth/logout`, {}, { headers }).pipe(
      tap((response: any) => {
      }),
      catchError((error: HttpErrorResponse) => { return throwError(() => error.error) })
    );
  }
}
