import { Injectable } from '@angular/core';
import { CanActivate, RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router';
import { Router } from '@angular/router';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    // Prefer sessionStorage (tab-scoped). Fall back to localStorage for compatibility.
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    // Aquí podrías agregar una validación más robusta del token (expiración, formato, etc.)
    if (token && token.length > 0) {
      // Si el token existe y es válido, redirige a inicio y permite el acceso
      if (state.url === '/auth/login') {
        this.router.navigate(['/inicio']);
        return false;
      }
      return true;
    }
    // Si no hay token, redirige a login
    this.router.navigate(['/auth/login']);
    return false;
  }
}