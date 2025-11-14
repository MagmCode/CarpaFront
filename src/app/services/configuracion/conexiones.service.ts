import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError, catchError, tap } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface ConexionSetting {
  system: string;
  modulo: string;
  user: string;
  password: string;
}

export interface ConexionesParameters {
  id?: string;
  system: string;
  profile: string;
  settings: ConexionSetting[];
}

@Injectable({
  providedIn: 'root'
})
export class ConexionesService {
  private apiUrl = environment.Url;

  private conexionesSubject: BehaviorSubject<ConexionesParameters | null> = new BehaviorSubject<ConexionesParameters | null>(null);
  public conexiones$ = this.conexionesSubject.asObservable();

  constructor(private http: HttpClient) { }

  buscar(payload: { system: string; profile: string }): Observable<ConexionesParameters | ConexionesParameters[]> {
    const url = `${this.apiUrl}/admin/systemparameters/buscar`;
    return this.http.post<ConexionesParameters | ConexionesParameters[]>(url, payload).pipe(
      tap((resp) => {
        if (!resp) return;
        if (Array.isArray(resp)) {
          // find the first matching profile if backend returns an array
          const found = (resp as ConexionesParameters[]).find(r => r.system === payload.system && r.profile === payload.profile) || null;
          if (found) this.conexionesSubject.next(found);
        } else {
          this.conexionesSubject.next(resp as ConexionesParameters);
        }
      }),
      catchError(this.handleError)
    );
  }

  crearConexiones(payload: ConexionesParameters): Observable<ConexionesParameters> {
    const url = `${this.apiUrl}/admin/systemparameters`;
    return this.http.post<ConexionesParameters>(url, payload).pipe(
      tap((resp) => this.conexionesSubject.next(resp)),
      catchError(this.handleError)
    );
  }

  editarConexiones(payload: ConexionesParameters): Observable<ConexionesParameters> {
    const url = `${this.apiUrl}/admin/systemparameters/editar`;
    return this.http.post<ConexionesParameters>(url, payload).pipe(
      tap((resp) => this.conexionesSubject.next(resp)),
      catchError(this.handleError)
    );
  }

  get currentValue(): ConexionesParameters | null {
    return this.conexionesSubject.value;
  }

  private handleError = (err: any) => {
    let msg = 'Error desconocido';
    if (err instanceof HttpErrorResponse) {
      msg = err.error?.message || err.message || `HTTP ${err.status}`;
    } else if (err && err.message) {
      msg = err.message;
    }
    return throwError(() => ({ message: msg, original: err }));
  }

}
