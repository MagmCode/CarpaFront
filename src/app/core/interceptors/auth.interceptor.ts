import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, EMPTY } from 'rxjs';
import { catchError } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { SessionSyncService } from 'src/app/services/session-sync.service'; 

let sessionExpiredAlertShown = false;

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
	constructor(private sessionSync: SessionSyncService) {}

	intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
		// Prefer sessionStorage (tab-scoped). Fall back to localStorage for compatibility with older code.
		const token = sessionStorage.getItem('token') || localStorage.getItem('token');
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
				if (error.status === 401 || error.status === 403) {
					// If the response includes a body (e.g. login endpoint returns a JSON with an error message),
					// let the caller (login form) handle it. Otherwise treat as token/session expiration.
					const body = error.error;
					const hasBody = body !== null && body !== undefined && !(
						typeof body === 'object' && Object.keys(body).length === 0
					) && !(typeof body === 'string' && body.trim() === '');

					if (hasBody) {
						// Propagate to caller (e.g. login component will show "usuario o clave inválido")
						return throwError(() => error);
					}

					// No body -> likely expired token / remote session invalidated. Show session-expired modal once.
					if (!sessionExpiredAlertShown) {
						sessionExpiredAlertShown = true;
						console.warn('[AUTH-INTERCEPTOR] 401/403 sin body detectado -> sesión expirada, mostrando alerta');
						// Broadcast logout so other tabs can react
						try { this.sessionSync.broadcast({ type: 'logout' }); } catch (e) { /* ignore */ }
						Swal.fire({
							icon: 'warning',
							title: 'Sesión expirada',
							text: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
							confirmButtonText: 'OK',
							allowOutsideClick: false
						}).then(() => {
							sessionExpiredAlertShown = false;
							console.warn('[AUTH-INTERCEPTOR] Redirigiendo a /auth/login');
							window.location.href = '/auth/login';
						});
					}
					return EMPTY;
				}
				return throwError(() => error);
			})
		);
	}
}