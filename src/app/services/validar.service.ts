import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { JwtService } from 'src/app/services/jwt.service';

@Injectable({
  providedIn: 'root',
})
export class ValidarService {
  private apiUrl: string = environment.Url;

  constructor(private http: HttpClient, private jwtService: JwtService) {}

  /**
   * Validate whether the current user's role is allowed to perform an action.
   * Sends POST to /api/auth/validate with body { actionUrl } and header X-Role-Id.
   */
  validate(actionUrl: string): Observable<{ allowed: boolean }> {

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    // Use the API-prefixed path as requested by the backend contract.
    const url = `${this.apiUrl}/auth/validate`;
    return this.http.post<{ allowed: boolean }>(url, { actionUrl }, { headers }).pipe(
      catchError((err: HttpErrorResponse) => {
        console.error('ValidarService.validate error', err);
        return throwError(() => err.error || { message: err.message || 'Validation service error' });
      })
    );
  }
}