// import { Injectable } from '@angular/core';
// import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse, HttpClient } from '@angular/common/http';
// import { Observable, throwError, BehaviorSubject } from 'rxjs';
// import { catchError, switchMap, filter, take, map } from 'rxjs/operators';

// @Injectable()
// export class AuthInterceptor implements HttpInterceptor {
//   private isRefreshing =  false;
//   private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

//   constructor(private http: HttpClient) {}

//   intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
//     const token = localStorage.getItem('token');
//     if (token) {
//       request = request.clone({
//         setHeaders: {
//           Authorization: `Bearer ${token}`
//         }
//       });
//     }
//     return next.handle(request).pipe(
//       catchError((error: HttpErrorResponse) => {
//         if (error.status === 401) {
//           return this.handle401Error(request, next);
//         }
//         return throwError(() => error);
//       })
//     );
//   }

//   private fetchNewToken(refreshToken: string): Observable<string> {
//     return this.http.post<{ token: string }>(
//       'http://180.183.67.228:8080/api/auth/refresh',
//       { refreshToken }
//     ).pipe(
//       map(response => response.token)
//     );
//   }

//   private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
//   if (!this.isRefreshing) {
//     this.isRefreshing = true;
//     this.refreshTokenSubject.next(null);

//     const refreshToken = localStorage.getItem('refreshToken');
//     if (!refreshToken) {
//       // Si no hay refresh token, redirige al login
//       this.isRefreshing = false;
//       window.location.href = '/auth/login';
//       return throwError(() => new Error('No refresh token'));
//     }

//     // Aquí haz la petición al endpoint de refresh del backend
//     return this.fetchNewToken(refreshToken).pipe(
//       switchMap((newToken: string) => {
//         this.isRefreshing = false;
//         localStorage.setItem('token', newToken);
//         this.refreshTokenSubject.next(newToken);
//         return next.handle(request.clone({
//           setHeaders: {
//             Authorization: `Bearer ${newToken}`
//           }
//         }));
//       }),
//       catchError((err) => {
//         this.isRefreshing = false;
//         window.location.href = '/auth/login';
//         return throwError(() => err);
//       })
//     );
//   } else {
//     return this.refreshTokenSubject.pipe(
//       filter(token => token != null),
//       take(1),
//       switchMap(token => next.handle(request.clone({
//         setHeaders: {
//           Authorization: `Bearer ${token}`
//         }
//       })))
//     );
//   }
// }

// }