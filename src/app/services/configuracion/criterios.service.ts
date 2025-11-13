import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError, map, catchError, tap } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CriteriosService {
  private apiUrl = environment.Url;

  // In-memory subject for current system parameters (criterios)
  private criteriosSubject: BehaviorSubject<SystemParameters | null> = new BehaviorSubject<SystemParameters | null>(null);
  public criterios$: Observable<SystemParameters | null> = this.criteriosSubject.asObservable();

  constructor(private http: HttpClient) { }

  /**
   * GET /admin/systemparameters
   * Fetch current system parameters for the application (profile: criterios)
   */
  getSystemParameters(): Observable<SystemParameters> {
    const url = `${this.apiUrl}/admin/systemparameters`;
    return this.http.get<SystemParameters>(url).pipe(
      tap((resp) => this.criteriosSubject.next(resp)),
      catchError(this.handleError)
    );
  }

  /**
   * POST /admin/systemparameters/editar
   * Edit existing criteria
   */
  editarCriterios(payload: SystemParameters): Observable<SystemParameters> {
    const url = `${this.apiUrl}/admin/systemparameters/editar`;
    return this.http.post<SystemParameters>(url, payload).pipe(
      tap((resp) => this.criteriosSubject.next(resp)),
      catchError(this.handleError)
    );
  }

  /**
   * POST /admin/systemparameters/crear
   * Create new criteria profile
   */
  crearCriterios(payload: SystemParameters): Observable<SystemParameters> {
    const url = `${this.apiUrl}/admin/systemparameters/crear`;
    return this.http.post<SystemParameters>(url, payload).pipe(
      tap((resp) => this.criteriosSubject.next(resp)),
      catchError(this.handleError)
    );
  }

  /** Convenience: refresh current criterios from server and update subject */
  refresh(): Observable<SystemParameters> {
    return this.getSystemParameters();
  }

  /** Get current value synchronously (may be null) */
  get currentValue(): SystemParameters | null {
    return this.criteriosSubject.value;
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

} // end class CriteriosService

// Local typings for the expected payload; adapt if backend shape differs
export interface SystemParameterSetting {
  key: string;
  value: any;
  type?: string | null;
  description?: string | null;
  active?: boolean | null;
}

export interface SystemParameters {
  id?: string;
  system: string;
  profile: string;
  settings: SystemParameterSetting[];
}