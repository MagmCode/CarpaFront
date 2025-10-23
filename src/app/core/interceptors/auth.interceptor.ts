import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, EMPTY } from 'rxjs';
import { catchError } from 'rxjs/operators';
import Swal from 'sweetalert2';

let sessionExpiredAlertShown = false;

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
	intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
		const token = localStorage.getItem('token');
		if (token === 'fake-token') {
			// En modo demo, nunca mostrar error de sesión expirada ni bloquear petición
			console.warn('[AUTH-INTERCEPTOR] Bypass: fake-token, no se muestra error de sesión expirada');
			return next.handle(request);
		}

		if (token) {
			request = request.clone({
				setHeaders: {
					Authorization: `${token}`
				}
			});
		}
		return next.handle(request).pipe(
			catchError((error: HttpErrorResponse) => {
				console.warn('[AUTH-INTERCEPTOR] catchError', error);
				if ((error.status === 401 || error.status === 403) && !sessionExpiredAlertShown) {
					console.warn('[AUTH-INTERCEPTOR] 401/403 detectado, mostrando alerta de sesión expirada');
					sessionExpiredAlertShown = true;
					localStorage.removeItem('token');
					localStorage.removeItem('refreshToken');
					Swal.fire({
						icon: 'warning',
						title: 'Sesión expirada',
						text: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
						confirmButtonText: 'OK',
						allowOutsideClick: false
					}).then(() => {
						console.warn('[AUTH-INTERCEPTOR] Redirigiendo a /auth/login');
						sessionExpiredAlertShown = false;
						window.location.href = '/auth/login';
					});
					return EMPTY;
				} else if (error.status === 401 || error.status === 403) {
					console.warn('[AUTH-INTERCEPTOR] 401/403 detectado, alerta ya mostrada, bloqueando petición');
					return EMPTY;
				}
				return throwError(() => error);
			})
		);
	}
}