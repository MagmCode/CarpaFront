
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError, map, catchError } from 'rxjs';
import { environment } from 'src/environments/environment';

interface Accion {
  idAction: number;
  url: string;
  description: string;
  idApplication: number;
  applicationName: string;
  secured: string;
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

  // Editar acción (PUT admin/acciones/editar/{id})
  editar(payload: any): Observable<any> {
    const id = payload.idAction;
    const url = `${this.apiUrl}/admin/acciones/editar/${id}`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    // No enviar idAction en el body
    const { idAction, ...body } = payload;
    return this.http.put<any>(url, body, { headers }).pipe(
      map((resp: any) => {
        const data = resp && resp.data ? resp.data : resp;
        const updated = Array.isArray(data) ? data[0] : data;
        if (updated) {
          try {
            const current = this.accionesSubject.getValue();
            const idx = current.findIndex(a => String(a.idAction) === String(updated.idAction));
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

  // Eliminar acción (DELETE admin/acciones/eliminar/{id})
  eliminar(id: number | string): Observable<any> {
    const url = `${this.apiUrl}/admin/acciones/eliminar/${id}`;
    return this.http.delete<any>(url).pipe(
      map((resp: any) => {
        const data = resp && resp.data ? resp.data : resp;
        // Actualizar cache local eliminando la acción
        try {
          const current = this.accionesSubject.getValue();
          const idx = current.findIndex((a: any) => String(a.idAction) === String(id));
          if (idx > -1) {
            const copy = [...current];
            copy.splice(idx, 1);
            this.accionesSubject.next(copy);
          }
        } catch (e) { /* ignore cache update errors */ }
        return data;
      }),
      catchError((err: HttpErrorResponse) => {
        console.error('AccionesService.eliminar error', err);
        return throwError(() => err.error || err.message || 'Error eliminando acción');
      })
    );
  }
}
