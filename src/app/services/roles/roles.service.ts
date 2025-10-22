import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, Observable, throwError, map } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class RolesService {
  /**
   * Crear un rol en el backend (POST /admin/roles/crear)
   */
  crearRol(payload: any): Observable<any> {
    const url = `${this.apiUrl}/admin/roles/crear`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<any>(url, payload, { headers }).pipe(
      map((response: any) => response),
      catchError((error: HttpErrorResponse) => {
        console.error('Error creando rol:', error);
        return throwError(() => error.error || { message: error.message || 'Error creando rol' });
      })
    );
  }

  /**
   * Modificar un rol en el backend (POST /admin/roles/actualizar)
   */
  modificarRol(payload: any): Observable<any> {
    const url = `${this.apiUrl}/admin/roles/actualizar`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<any>(url, payload, { headers }).pipe(
      map((response: any) => response),
      catchError((error: HttpErrorResponse) => {
        console.error('Error modificando rol:', error);
        return throwError(() => error.error || { message: error.message || 'Error modificando rol' });
      })
    );
  }


  private rolesSubject = new BehaviorSubject<any[]>([]);
  private apiUrl: string = environment.Url;
  roles$ = this.rolesSubject.asObservable();

  constructor(private http: HttpClient) {}

  // buscarRolesUsuarios(): Observable <any> {
  //   return this.http.get<any>(`${this.apiUrl}/admin/roles/usuario/260`).pipe(
  //       map((response: any)=> {
  //           return response
  //       }),
  //       catchError((error: HttpErrorResponse)=> {return throwError(()=>error.error)})
  //   )
  // }

  //

  setRoles(roles: any[]) {
    this.rolesSubject.next(roles);
  }

  getRoles(): any[] {
    return this.rolesSubject.getValue();
  }

  // Accept any payload (the backend expects JSON) and set headers accordingly.
  consultarRoles(payload: any): Observable<any> {
    const url = `${this.apiUrl}/admin/roles/buscar`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<any>(url, payload, { headers }).pipe(
      map((response: any) => {
        console.log('RolesService response:', response);
        return response;
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('RolesService error details:', {
          status: error.status,
          url: error.url,
          message: error.message,
          error: error.error,
        });
        return throwError(
          () => error.error || { message: error.message || 'Unknown error' }
        );
      })
    );
  }

  rolesmenu(payload: any): Observable<any> {
    const url = `${this.apiUrl}/admin/roles-menus/sincronizar-menus`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<any>(url, payload, { headers });
  }

  rolesAcciones(payload: any): Observable<any> {
    const url = `${this.apiUrl}/admin/roles-actions/sincronizar-acciones`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<any>(url, payload, { headers });
  }

    /**
   * Buscar acciones por roles
   * @param payload { roleId: string | number }
   */

  buscarAccionesPorRol(payload: any): Observable<any> {
    const url = `${this.apiUrl}/admin/roles-actions/ActionsByRole`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<any>(url, payload, { headers });
  }

  /**
   * Buscar menú por roles
   * @param payload { roleId: string | number }
   */
  buscarMenuPorRol(payload: any): Observable<any> {
    const url = `${this.apiUrl}/admin/roles-actions/MenuByRole`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<any>(url, payload, { headers });
  }
}
