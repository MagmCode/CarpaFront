import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError, map, BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';

/**
 * Aplicacion: now uses the backend DTO shape directly.
 * This is intentionally the exact shape expected/returned by the API
 * to avoid desynchronization between client-side and server-side data.
 */
export interface Aplicacion {
  idApplication: number;
  description: string;
  siglasApplic: string;
  comentarios?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AplicacionesService {
  private apiUrl = environment.Url;
  private aplicacionesSubject = new BehaviorSubject<Aplicacion[]>([]);

  constructor(private http: HttpClient) {}

  // Public observable for components that want to react to changes
  getAplicaciones$(): Observable<Aplicacion[]> {
    return this.aplicacionesSubject.asObservable();
  }

  // Synchronous getter (returns current cached value)
  getAplicaciones(): Aplicacion[] {
    return this.aplicacionesSubject.getValue();
  }

  // Load from backend and update the subject; returns observable of backend-shaped Aplicacion[]
  loadAplicaciones(): Observable<Aplicacion[]> {
    return this.http.get<Aplicacion[]>(`${this.apiUrl}/admin/app/all`).pipe(
      map((items: Aplicacion[]) => {
        const apps = items || [];
        this.aplicacionesSubject.next(apps);
        return apps;
      }),
      catchError((error: HttpErrorResponse) => {
        // keep subject untouched on error, rethrow simplified error
        console.error('Error loading aplicaciones', error);
        return throwError(() => error.error || error.message || 'Error cargando aplicaciones');
      })
    );
  }


  setAplicaciones(aplicaciones: Aplicacion[]) {
    this.aplicacionesSubject.next(aplicaciones);
  }

  /**
   * Update an aplicacion on the backend (PUT /admin/app/update).
   * Accepts either the internal Aplicacion shape or the BackendAplicacion shape.
   * On success it maps the returned backend object to Aplicacion and updates the cached list.
   */
  updateAplicacion(input: Aplicacion): Observable<Aplicacion> {
    const url = `${this.apiUrl}/admin/app/update`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    // build payload directly from the backend-shaped Aplicacion input
    const payload: Aplicacion = (input as Aplicacion);

    return this.http.put<any>(url, payload, { headers }).pipe(
      map((resp: any) => {
        // backend may return envelope { success, data } or the updated object directly
        const raw = resp && resp.data ? resp.data : resp;
        const backendObj = Array.isArray(raw) ? raw[0] : raw;
        const updated: Aplicacion = backendObj as Aplicacion;

        // update cache atomically (compare by idApplication)
        const current = this.aplicacionesSubject.getValue();
        const idx = current.findIndex(a => String(a.idApplication) === String(updated.idApplication));
        if (idx > -1) {
          const copy = [...current];
          copy[idx] = updated;
          this.aplicacionesSubject.next(copy);
        } else {
          this.aplicacionesSubject.next([updated, ...current]);
        }

        return updated;
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error updating aplicacion', { status: error.status, error: error.error });
        return throwError(() => error.error || error.message || 'Error actualizando aplicacion');
      })
    );
  }

  /**
   * Create a new aplicacion on the backend (POST /admin/app/create).
   * Sends the backend-shaped DTO; if idApplication is 0 it will be omitted.
   * On success, prepends the created item to the cache and returns it.
   */
  createAplicacion(input: Aplicacion): Observable<Aplicacion> {
    const url = `${this.apiUrl}/admin/app/create`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    // build payload; omit idApplication if it's 0 or falsy (backend will assign)
    const payload: any = { ...input };
    if (!payload.idApplication || Number(payload.idApplication) === 0) {
      delete payload.idApplication;
    }

    return this.http.post<any>(url, payload, { headers }).pipe(
      map((resp: any) => {
        const raw = resp && resp.data ? resp.data : resp;
        const backendObj = Array.isArray(raw) ? raw[0] : raw;
        const created: Aplicacion = backendObj as Aplicacion;

        // prepend to cache
        const current = this.aplicacionesSubject.getValue();
        this.aplicacionesSubject.next([created, ...current]);

        return created;
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error creating aplicacion', { status: error.status, error: error.error });
        return throwError(() => error.error || error.message || 'Error creando aplicacion');
      })
    );
  }

  /**
   * Delete an aplicacion by id.
   * NOTE: backend expects a POST to /admin/app/delete where the request body contains the idApplication to delete.
   * We send the id value as the JSON body (e.g. `123`) and on success remove it from the cache.
   */
  deleteAplicacion(id: number | string): Observable<any> {
    const url = `${this.apiUrl}/admin/app/delete`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    // backend expects the id as the body (not an object wrapper)
    const body: any = id;

    return this.http.post<any>(url, body, { headers }).pipe(
      map((resp: any) => {
        const raw = resp && resp.data ? resp.data : resp;
        // On success, remove from cache if present
        try {
          const current = this.aplicacionesSubject.getValue();
          const idx = current.findIndex(a => String(a.idApplication) === String(id));
          if (idx > -1) {
            const copy = [...current];
            copy.splice(idx, 1);
            this.aplicacionesSubject.next(copy);
          }
        } catch (e) {
          // ignore cache update errors
        }
        return raw;
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error deleting aplicacion', { status: error.status, error: error.error });
        return throwError(() => error.error || error.message || 'Error eliminando aplicacion');
      })
    );
  }
}
