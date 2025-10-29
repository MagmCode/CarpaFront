
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface EquipoRecord {
  id?: string;
  host: string;
  mac: string;
  description?: string;
  identifier?: string;
  type?: string;
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class EquiposService {
  private url = environment.Url;
  private equiposSubject = new BehaviorSubject<EquipoRecord[]>([]);

  constructor(private http: HttpClient) {}

  // Observable para componentes
  getEquipos$(): Observable<EquipoRecord[]> {
    return this.equiposSubject.asObservable();
  }

  // Síncrono (cache local)
  getEquipos(): EquipoRecord[] {
    return this.equiposSubject.getValue();
  }

  // Cargar desde backend y actualizar subject
  loadEquipos(): Observable<EquipoRecord[]> {
    return this.http.get<any>(`${this.url}/admin/communications/list`).pipe(
      map((items: any) => {
        const equipos = Array.isArray(items) ? items : (items.data || []);
        this.equiposSubject.next(equipos);
        return equipos;
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error loading equipos', error);
        return throwError(() => error.error || error.message || 'Error cargando equipos');
      })
    );
  }

  setEquipos(equipos: EquipoRecord[]) {
    this.equiposSubject.next(equipos);
  }

  crearEquipo(data: Omit<EquipoRecord, 'id'>): Observable<EquipoRecord> {
    return this.http.post<any>(`${this.url}/admin/communications/create`, data).pipe(
      map((resp: any) => {
        const raw = resp && resp.data ? resp.data : resp;
        const backendObj = Array.isArray(raw) ? raw[0] : raw;
        const created: EquipoRecord = backendObj as EquipoRecord;
        // prepend to cache
        const current = this.equiposSubject.getValue();
        this.equiposSubject.next([created, ...current]);
        return created;
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error creating equipo', error);
        return throwError(() => error.error || error.message || 'Error creando equipo');
      })
    );
  }

  modificarEquipo(data: EquipoRecord): Observable<EquipoRecord> {
    return this.http.post<any>(`${this.url}/admin/communications/update`, data).pipe(
      map((resp: any) => {
        const raw = resp && resp.data ? resp.data : resp;
        const backendObj = Array.isArray(raw) ? raw[0] : raw;
        const updated: EquipoRecord = backendObj as EquipoRecord;
        // update cache atomically (compare by id)
        const current = this.equiposSubject.getValue();
        const idx = current.findIndex(e => String(e.id) === String(updated.id));
        if (idx > -1) {
          const copy = [...current];
          copy[idx] = updated;
          this.equiposSubject.next(copy);
        } else {
          this.equiposSubject.next([updated, ...current]);
        }
        return updated;
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error updating equipo', error);
        return throwError(() => error.error || error.message || 'Error actualizando equipo');
      })
    );
  }

}
