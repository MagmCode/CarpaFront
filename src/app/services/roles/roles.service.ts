import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, Observable, throwError, map } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RolesService {
    private rolesSubject = new BehaviorSubject<any[]>([]);
    private apiUrl: string = environment.Url;
    roles$ = this.rolesSubject.asObservable();


  constructor(private http: HttpClient) { }

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

  consultarRoles(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/admin/roles/usuario/260`).pipe(
      map((response: any) => {
        console.log('RolesService:', response);
        return response;
      }),
      catchError((error: HttpErrorResponse) => throwError(() => error.error))
    );
  }
}
