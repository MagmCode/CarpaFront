import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  catchError,
  Observable,
  throwError,
  map,
  BehaviorSubject,
  tap,
} from 'rxjs';
import { environment } from 'src/environments/environment';
import { Usuario, RolUsuario } from 'src/app/core/models/usuarios/usuario';

@Injectable({
  providedIn: 'root',
})
export class UsuariosService {
  /**
   * Buscar usuario por userId en el backend (POST /admin/users/search)
   * Retorna datos del usuario para autocompletar campos en el formulario.
   */
  buscarUsuario(userId: string): Observable<any> {
    const url = `${this.apiUrl}/admin/users/search`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const body = { userId };
    return this.http.post<any>(url, body, { headers }).pipe(
      map((resp: any) => this.normalizeRaw<any>(resp)),
      catchError((error: HttpErrorResponse) => {
        console.error('Error buscando usuario', { status: error.status, error: error.error });
        return throwError(() => error.error || error.message || 'Error buscando usuario');
      })
    );
  }
  private apiUrl = environment.Url;
  private usuariosSubject = new BehaviorSubject<any[]>([]);
  usuarios$ = this.usuariosSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Helper: normalize response which may be enveloped as { data: ... } or be the raw payload
  private normalizeRaw<T>(resp: any): T | T[] {
    const raw = resp && resp.data ? resp.data : resp;
    return raw;
  }

  consultarUsuarios(): Observable<Usuario[]> {
    const url = `${this.apiUrl}/admin/users/all`;
    return this.http.get<any>(url).pipe(
      map((resp: any) => {
        const raw = this.normalizeRaw<Usuario[]>(resp) as Usuario[];
        const list = Array.isArray(raw) ? raw : [];
        // update local cache so components can subscribe to usuarios$
        try {
          this.usuariosSubject.next(list);
        } catch (e) {
          // ignore cache errors
        }
        return list;
      }),
      catchError((error: HttpErrorResponse) => {
        return throwError(() => error.error || error.message || 'Error consultando usuarios');
      })
    );
  }

  /**
   * Update a usuario via PUT /admin/users/update
   * Expects the backend-shaped user object. On success update cache if present.
   */
  updateUsuario(usuario: Usuario): Observable<Usuario> {
    const url = `${this.apiUrl}/admin/users/update`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.put<any>(url, usuario, { headers }).pipe(
      map((resp: any) => this.normalizeRaw<Usuario>(resp) as Usuario),
      map((raw: any) => (Array.isArray(raw) ? raw[0] : raw) as Usuario),
      tap((updated: Usuario) => {
        try {
          const current = this.usuariosSubject.getValue();
          const idx = current.findIndex(u => String(u.userId || u.mscUserId) === String(updated.userId || updated.mscUserId));
          if (idx > -1) {
            const copy = [...current];
            copy[idx] = updated;
            this.usuariosSubject.next(copy);
          }
        } catch (e) {
          // ignore cache update errors
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error updating usuario', { status: error.status, error: error.error });
        return throwError(() => error.error || error.message || 'Error actualizando usuario');
      })
    );
  }

  /**
   * Create a usuario via POST /admin/users/create
   * On success prepend to cache.
   */
  createUsuario(usuario: Usuario): Observable<Usuario> {
    const url = `${this.apiUrl}/admin/users/create`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.post<any>(url, usuario, { headers }).pipe(
      map((resp: any) => this.normalizeRaw<Usuario>(resp) as Usuario),
      map((raw: any) => (Array.isArray(raw) ? raw[0] : raw) as Usuario),
      tap((created: Usuario) => {
        try {
          const current = this.usuariosSubject.getValue();
          this.usuariosSubject.next([created, ...current]);
        } catch (e) {
          // ignore cache update errors
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error creating usuario', { status: error.status, error: error.error });
        return throwError(() => error.error || error.message || 'Error creando usuario');
      })
    );
  }

  /**
   * Delete a usuario via POST /admin/users/delete sending body { userId } or id as needed
   */
  deleteUsuario(id: string | number): Observable<any> {
    const url = `${this.apiUrl}/admin/users/delete`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const body: any = { userId: id };

    return this.http.post<any>(url, body, { headers }).pipe(
      map((resp: any) => this.normalizeRaw<any>(resp)),
      tap(() => {
        try {
          const current = this.usuariosSubject.getValue();
          const idx = current.findIndex(u => String(u.userId || u.mscUserId) === String(id));
          if (idx > -1) {
            const copy = [...current];
            copy.splice(idx, 1);
            this.usuariosSubject.next(copy);
          }
        } catch (e) {
          // ignore cache update errors
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error deleting usuario', { status: error.status, error: error.error });
        return throwError(() => error.error || error.message || 'Error eliminando usuario');
      })
    );
  }

  /**
   * Assign roles to a user via POST /admin/roles/asignarroles
   * Payload should be the backend expected shape (e.g. { userId, roles: [...] }).
   */
  asignarRoles(payload: any): Observable<any> {
    const url = `${this.apiUrl}/admin/roles/asignarroles`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.post<any>(url, payload, { headers }).pipe(
      map((resp: any) => this.normalizeRaw<any>(resp)),
      catchError((error: HttpErrorResponse) => {
        console.error('Error asignando roles', { status: error.status, error: error.error });
        return throwError(() => error.error || error.message || 'Error asignando roles');
      })
    );
  }

  /**
   * Get roles for a given user: GET /admin/roles/usuario?mscUserId=...
   */
  getRolesUsuario(userId: string | number): Observable<RolUsuario[]> {
    const url = `${this.apiUrl}/admin/roles/usuario/`;
    const fullUrl = `${url}${userId}`;
    // debug log to help troubleshoot differences vs Postman
    console.debug('[UsuariosService] getRolesUsuario ->', fullUrl);
    return this.http.get<any>(fullUrl).pipe(
      map((resp: any) => {
        const raw = this.normalizeRaw<RolUsuario[]>(resp) as RolUsuario[];
        return Array.isArray(raw) ? raw : [];
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error obteniendo roles de usuario', { status: error.status, error: error.error });
        return throwError(() => error.error || error.message || 'Error obteniendo roles');
      })
    );
  }

    /**
     * Editar estatus masivo de usuarios via POST /admin/users/update/batch
     * Recibe payload { userId: string[], userStatus: number }
     */
    editarEstatusMasivo(payload: { userId: string[]; userStatus: number }): Observable<any> {
      const url = `${this.apiUrl}/admin/users/update/batch`;
      const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
      return this.http.post<any>(url, payload, { headers }).pipe(
        map((resp: any) => this.normalizeRaw<any>(resp)),
        catchError((error: HttpErrorResponse) => {
          console.error('Error en edición masiva de estatus', { status: error.status, error: error.error });
          return throwError(() => error.error || error.message || 'Error editando estatus masivo');
        })
      );
    }
}
