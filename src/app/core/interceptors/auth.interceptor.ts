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
					// Distinguish between requests made without a token (e.g. login attempts or unauthenticated calls)
					const hasToken = !!(sessionStorage.getItem('token') || localStorage.getItem('token'));
					if (!hasToken) {
						// No token present: this is likely a login failure or unauthenticated request.
						// Show a lightweight toast and rethrow so the caller can handle specifics.
						Swal.fire({
							icon: 'error',
							title: 'No autorizado',
							text: 'Credenciales inválidas o sin permisos.',
							toast: true,
							position: 'top-start',
							showConfirmButton: false,
							timer: 3000,
							timerProgressBar: true
						});
						return throwError(() => error);
					}
					// Token exists -> session likely expired or invalid. Show session-expired modal once.
					if (!sessionExpiredAlertShown) {
						sessionExpiredAlertShown = true;
						console.warn('[AUTH-INTERCEPTOR] 401/403 detectado con token presente, mostrando alerta de sesión expirada');
						// Clear tokens from both storages to be safe
						try { sessionStorage.removeItem('token'); sessionStorage.removeItem('refreshToken'); } catch (e) {}
						try { localStorage.removeItem('token'); localStorage.removeItem('refreshToken'); } catch (e) {}
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