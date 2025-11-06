import { Component, OnInit, OnDestroy, Inject, Renderer2 } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { NotificationService, Notificacion } from 'src/app/core/services/notification.service';
import { DateUtilsServiceTsService } from 'src/app/core/services/date-utils.service';
import { LogoutService } from 'src/app/services/logout.service';
import { environment } from 'src/environments/environment';
import { SessionSyncService } from 'src/app/services/session-sync.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
today: Date = new Date();
  private timerId: any;
  ambiente = environment.nombreAmbiente;

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
  ) {}

  ngOnInit(): void {
    this.usuarioActual = sessionStorage.getItem('usuarioActual');
    this.notificationService.notificacion$.subscribe((n) => {
      this.notificaciones.unshift(n);
    });
    this.timerId = setInterval(() => {
      this.today = new Date();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
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
          this.logoutService.logout(token).subscribe({
            next: () => {
              // Broadcast logout to other tabs
              try { this.sessionSync.broadcast({ type: 'logout' }); } catch (e) {}
              // Clear both storages to avoid stale values
              try { sessionStorage.clear(); } catch (e) {}
              try { localStorage.clear(); } catch (e) {}
              this.router.navigate(['/auth/login']);
            },
            error: (err) => {
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
