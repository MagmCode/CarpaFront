import { Component, OnInit, OnDestroy, Inject, Renderer2 } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { NotificationService, Notificacion } from 'src/app/core/services/notification.service';
import { DateUtilsServiceTsService } from 'src/app/core/services/date-utils.service';
import { LogoutService } from 'src/app/services/logout.service';
import { environment } from 'src/environments/environment';
import { SessionSyncService } from 'src/app/services/session-sync.service';
import { JwtService } from 'src/app/services/jwt.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
today: Date = new Date();
  private timerId: any;
  ambiente = environment.nombreAmbiente;
  usuarioRoleName: string | null = null;
  loading: boolean = false;

  fechaFormateada(): string {
    return this.dateUtils.fullFormatDate(this.today);
  }

  // Calcula el tiempo transcurrido desde la fecha de la notificación
  tiempoTranscurrido(fecha: Date): string {
    const ahora = new Date();
    const diffMs = ahora.getTime() - new Date(fecha).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'hace unos segundos';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `hace ${diffMin} min`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `hace ${diffHr} h`;
    const diffDay = Math.floor(diffHr / 24);
    return `hace ${diffDay} d`;
  }
  // Notificaciones dinámicas
  notificaciones: Notificacion[] = [];

  irANotificacion(n: any) {
    if (n.ruta) {
      this.router.navigate([n.ruta]);
      // Elimina la notificación del array
      this.notificaciones = this.notificaciones.filter((notif) => notif !== n);
    }
  }

  get cantidadNotificaciones(): number {
    return this.notificaciones.length;
  }

  limpiarNotificaciones() {
    this.notificaciones = [];
  }

  usuarioActual: string | null = null;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private renderer: Renderer2,
    private router: Router,
    private notificationService: NotificationService,
    private dateUtils: DateUtilsServiceTsService,
    private logoutService: LogoutService,
    private sessionSync: SessionSyncService
    , private jwtService: JwtService
  ) {}

  ngOnInit(): void {
    this.usuarioActual = sessionStorage.getItem('usuarioActual');
    this.usuarioRoleName = sessionStorage.getItem('usuarioRoleName');
    this.notificationService.notificacion$.subscribe((n) => {
      this.notificaciones.unshift(n);
    });
    this.timerId = setInterval(() => {
      this.today = new Date();
    }, 1000);

    // Keep navbar in sync when other tabs broadcast login/logout events
    try {
      this.sessionSync.onEvent((ev) => {
        if (ev && (ev.type === 'login' || ev.type === 'logout' || ev.type === 'refresh')) {
          // Re-read session values (safe even if missing)
          try { this.usuarioActual = sessionStorage.getItem('usuarioActual'); } catch (e) { this.usuarioActual = null; }
          try { this.usuarioRoleName = sessionStorage.getItem('usuarioRoleName'); } catch (e) { this.usuarioRoleName = null; }
        }
      });
      // Also subscribe to JWT payload so we can read claims directly when available
      try {
        this.jwtService.payload$.subscribe(p => {
          if (p) {
            // Prefer explicit claim names commonly used. If fullName is provided, format it to "FirstName FirstFamily".
            const roleClaim = p['roleName'] || p['role'] || p['rol'] || (Array.isArray(p['roles']) ? p['roles'][0] : undefined);
            if (roleClaim) this.usuarioRoleName = roleClaim;

            // Token may include different name claims; prefer fullName and format it.
            const fullNameClaim = (p['fullName'] || p['fullname'] || p['name'] || p['nombre'] || p['given_name'] || p['preferred_username'] || p['sub']);
            if (fullNameClaim && typeof fullNameClaim === 'string') {
              this.usuarioActual = this.formatFullName(fullNameClaim);
            } else if (fullNameClaim) {
              // non-string (unlikely) - stringify safely
              this.usuarioActual = this.formatFullName(String(fullNameClaim));
            }
          }
        });
      } catch (e) { /* ignore */ }
    } catch (e) {
      // ignore
    }
  }

  ngOnDestroy(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  }

  /**
   * Reduce a full name to "FirstGiven FirstFamily" similar to LoginComponent.buildDisplayName
   */
  private formatFullName(full: string): string {
    if (!full) return '';
    const parts = full.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '';
    const firstGiven = parts[0] || '';
    let firstFamily = '';
    if (parts.length === 1) firstFamily = '';
    else if (parts.length === 2) firstFamily = parts[1];
    else if (parts.length === 3) firstFamily = parts[2];
    else if (parts.length >= 4) firstFamily = parts[parts.length - 2];
    else firstFamily = parts[parts.length - 1];
    return (firstGiven + (firstFamily ? ' ' + firstFamily : '')).trim();
  }

  /**
   * Sidebar toggle on hamburger button click
   */
  toggleSidebar(e: Event) {
    e.preventDefault();
    this.document.body.classList.toggle('sidebar-open');
  }

  /**
   * Logout
   */
  onLogout(e?: Event) {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

Swal.fire({
      icon: 'warning',
      title: '¿Estás seguro que deseas cerrar sesión?',
      showCancelButton: true,
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar',
      allowOutsideClick: false
    }).then((result) => {
      if (result.isConfirmed) {
        // Prefer sessionStorage token, fallback to localStorage
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        if (token) {
          this.loading = true;
          this.logoutService.logout(token).subscribe({
            next: () => {
              this.loading = false;
              // Broadcast logout to other tabs
              try { this.sessionSync.broadcast({ type: 'logout' }); } catch (e) {}
              try { this.jwtService.clear(); } catch (e) {}
              // Clear both storages to avoid stale values
              try { sessionStorage.clear(); } catch (e) {}
              try { localStorage.clear(); } catch (e) {}
              this.router.navigate(['/auth/login']);
            },
            error: (err) => {
              this.loading = false;
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Ocurrió un error al cerrar sesión. Por favor, intenta nuevamente.',
                confirmButtonText: 'OK',
                allowOutsideClick: false
              })
              console.error('Error al cerrar sesión:', err);
            },
          });
        } else {
          try { this.sessionSync.broadcast({ type: 'logout' }); } catch (e) {}
          try { sessionStorage.clear(); } catch (e) {}
          try { localStorage.clear(); } catch (e) {}
          this.router.navigate(['/auth/login']);
        }
      }
    });
  }
}
