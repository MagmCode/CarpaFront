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

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private apiUrl = environment.Url;

  private menuSubject = new BehaviorSubject<any[]>([]);
  menu$ = this.menuSubject.asObservable();

  constructor(private http: HttpClient) {}

  OpcionesMenu(): { payload: Observable<any> } {
    return {
      payload: this.http.get<any>(`${this.apiUrl}/admin/menu/buscar`).pipe(
        map((response: any) => {
          console.log('MenuService:', response);
          return response;
        })
      ),
    };
  }
}
