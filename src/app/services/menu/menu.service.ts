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
  switchMap,
} from 'rxjs';
import { environment } from 'src/environments/environment';

interface MenuOption {
  nombre: string;
  ruta: string;
  idAplicacion: number;
  orden: number;
  siglasAplicacion: string;
  idPadre: number | null;
}
@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private apiUrl = environment.Url;

  private menuSubject = new BehaviorSubject<any[]>([]);
  menu$ = this.menuSubject.asObservable();

  constructor(private http: HttpClient) {}
  OpcionesMenu(): Observable<any[]> {
    const url = `${this.apiUrl}/admin/menu/buscar`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    // use POST with an empty payload to match other backend endpoints (some endpoints expect POST)
    return this.http.post<any>(url, {}, { headers }).pipe(
      map((response: any) => {
        // backend may return an envelope { data: [...] } or the array directly
        const raw = response && response.data ? response.data : response;
        const list = Array.isArray(raw) ? raw : [];
        console.log('MenuService OpcionesMenu:', { url, resultCount: list.length });
        // update subject for other consumers
        try { this.menuSubject.next(list); } catch (e) { /* ignore */ }
        return list;
      })
    );
  }

  /**
   * Create a menu option: POST /admin/menu/crear
   * Expects backend-shaped payload. On success, prepends to the menuSubject.
   */
  crearMenu(payload: any): Observable<any> {
    const url = `${this.apiUrl}/admin/menu/crear`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<any>(url, payload, { headers }).pipe(
      map((resp: any) => {
        const raw = resp && resp.data ? resp.data : resp;
        const backendObj = Array.isArray(raw) ? raw[0] : raw;
        try {
          const current = this.menuSubject.getValue() || [];
          this.menuSubject.next([backendObj, ...current]);
        } catch (e) { /* ignore cache update errors */ }
        return backendObj;
      }),
      catchError((err: HttpErrorResponse) => {
        console.error('Error creating menu item', { status: err.status, error: err.error });
        return throwError(() => err.error || err.message || 'Error creando opción de menú');
      })
    );
  }

  /**
   * Edit a menu option: PUT /admin/menu/editar
   * On success updates the cached menuSubject entry (by id).
   */
  editarMenu(payload: any): Observable<any> {
    const url = `${this.apiUrl}/admin/menu/editar`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<any>(url, payload, { headers }).pipe(
      map((resp: any) => {
        const raw = resp && resp.data ? resp.data : resp;
        const backendObj = Array.isArray(raw) ? raw[0] : raw;
        try {
          const current = this.menuSubject.getValue() || [];
          const id = backendObj?.id;
          const idx = current.findIndex((m: any) => String(m.id) === String(id));
          if (idx > -1) {
            const copy = [...current];
            copy[idx] = backendObj;
            this.menuSubject.next(copy);
          }
        } catch (e) { /* ignore cache update errors */ }
        return backendObj;
      }),
      catchError((err: HttpErrorResponse) => {
        console.error('Error editing menu item', { status: err.status, error: err.error });
        return throwError(() => err.error || err.message || 'Error editando opción de menú');
      })
    );
  }

  /**
   * Delete a menu option: DELETE /admin/menu/eliminar/{id}
   * On success removes from cached menuSubject.
   */
  eliminarMenu(id: number | string): Observable<any> {
    const url = `${this.apiUrl}/admin/menu/eliminar/${id}`;
    return this.http.delete<any>(url).pipe(
      map((resp: any) => {
        const raw = resp && resp.data ? resp.data : resp;
        try {
          const current = this.menuSubject.getValue() || [];
          const idx = current.findIndex((m: any) => String(m.id) === String(id));
          if (idx > -1) {
            const copy = [...current];
            copy.splice(idx, 1);
            this.menuSubject.next(copy);
          }
        } catch (e) { /* ignore cache update errors */ }
        return raw;
      }),
      catchError((err: HttpErrorResponse) => {
        console.error('Error deleting menu item', { status: err.status, error: err.error });
        return throwError(() => err.error || err.message || 'Error eliminando opción de menú');
      })
    );
  }
}
