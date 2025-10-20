import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError, map, catchError } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Accion {
  id?: number | string;
  nombre: string;
  descripcion?: string;
  aplicacion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AccionesService {
  private apiUrl = environment.Url;
  private accionesSubject = new BehaviorSubject<Accion[]>([]);

  constructor(private http: HttpClient) { }

  // Observable público
  getAcciones$(): Observable<Accion[]> {
    return this.accionesSubject.asObservable();
  }

  // Getter síncrono
  getAcciones(): Accion[] {
    return this.accionesSubject.getValue();
  }

  // Buscar acciones (POST admin/acciones/buscar)
  buscar(payload: any): Observable<any> {
    const url = `${this.apiUrl}/admin/acciones/buscar`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<any>(url, payload, { headers }).pipe(
      map((resp: any) => {
        const data = resp && resp.data ? resp.data : resp;
        const list = Array.isArray(data) ? data : (data ? [data] : []);
        // actualizar cache local si viene lista
        if (list.length) this.accionesSubject.next(list as Accion[]);
        return resp;
      }),
      catchError((err: HttpErrorResponse) => {
        console.error('AccionesService.buscar error', err);
        return throwError(() => err.error || err.message || 'Error buscando acciones');
      })
    );
  }

  // Crear acción (POST admin/acciones/crear)
  crear(payload: any): Observable<any> {
    const url = `${this.apiUrl}/admin/acciones/crear`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<any>(url, payload, { headers }).pipe(
      map((resp: any) => {
        const data = resp && resp.data ? resp.data : resp;
        const created = Array.isArray(data) ? data[0] : data;
        if (created) {
          const current = this.accionesSubject.getValue();
          this.accionesSubject.next([created as Accion, ...current]);
        }
        return resp;
      }),
      catchError((err: HttpErrorResponse) => {
        console.error('AccionesService.crear error', err);
        return throwError(() => err.error || err.message || 'Error creando accion');
      })
    );
  }

  // Editar acción (POST admin/acciones/editar)
  editar(payload: any): Observable<any> {
    const url = `${this.apiUrl}/admin/acciones/editar`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<any>(url, payload, { headers }).pipe(
      map((resp: any) => {
        const data = resp && resp.data ? resp.data : resp;
        const updated = Array.isArray(data) ? data[0] : data;
        if (updated) {
          try {
            const current = this.accionesSubject.getValue();
            const idx = current.findIndex(a => String(a.id) === String(updated.id));
            if (idx > -1) {
              const copy = [...current];
              copy[idx] = updated as Accion;
              this.accionesSubject.next(copy);
            }
          } catch (e) {
            // ignore cache update errors
          }
        }
        return resp;
      }),
      catchError((err: HttpErrorResponse) => {
        console.error('AccionesService.editar error', err);
        return throwError(() => err.error || err.message || 'Error editando accion');
      })
    );
  }
}
