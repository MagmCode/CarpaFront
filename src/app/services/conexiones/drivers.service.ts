
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface DriverRecord {
  id?: number;
  connectionName: string;
  datasourceType: string;
  jdbcUrl: string;
  username: string;
  password?: string;
  driverClassName: string;
  enabled: boolean;
  profile: string;
}

@Injectable({ providedIn: 'root' })
export class DriversService {
  private url = environment.Url;
  private driversSubject = new BehaviorSubject<DriverRecord[]>([]);

  constructor(private http: HttpClient) {}

  // Observable para componentes
  getDrivers$(): Observable<DriverRecord[]> {
    return this.driversSubject.asObservable();
  }

  // Síncrono (cache local)
  getDrivers(): DriverRecord[] {
    return this.driversSubject.getValue();
  }

  // Cargar desde backend y actualizar subject
  loadDrivers(): Observable<DriverRecord[]> {
    return this.http.get<DriverRecord[]>(`${this.url}/admin/drivers`).pipe(
      map((items: any) => {
        const drivers = Array.isArray(items) ? items : (items?.drivers || []);
        this.driversSubject.next(drivers);
        return drivers;
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error loading drivers', error);
        return throwError(() => error.error || error.message || 'Error cargando drivers');
      })
    );
  }

  setDrivers(drivers: DriverRecord[]) {
    this.driversSubject.next(drivers);
  }

  crearDriver(data: Omit<DriverRecord, 'id'>): Observable<DriverRecord> {
    return this.http.post<any>(`${this.url}/admin/drivers/create`, data).pipe(
      map((resp: any) => {
        const raw = resp && resp.data ? resp.data : resp;
        const backendObj = Array.isArray(raw) ? raw[0] : raw;
        const created: DriverRecord = backendObj as DriverRecord;
        // prepend to cache
        const current = this.driversSubject.getValue();
        this.driversSubject.next([created, ...current]);
        return created;
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error creating driver', error);
        return throwError(() => error.error || error.message || 'Error creando driver');
      })
    );
  }

  modificarDriver(data: DriverRecord): Observable<DriverRecord> {
    return this.http.post<any>(`${this.url}/admin/drivers/update`, data).pipe(
      map((resp: any) => {
        const raw = resp && resp.data ? resp.data : resp;
        const backendObj = Array.isArray(raw) ? raw[0] : raw;
        const updated: DriverRecord = backendObj as DriverRecord;
        // update cache atomically (compare by id)
        const current = this.driversSubject.getValue();
        const idx = current.findIndex(d => String(d.id) === String(updated.id));
        if (idx > -1) {
          const copy = [...current];
          copy[idx] = updated;
          this.driversSubject.next(copy);
        } else {
          this.driversSubject.next([updated, ...current]);
        }
        return updated;
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error updating driver', error);
        return throwError(() => error.error || error.message || 'Error actualizando driver');
      })
    );
  }
}
