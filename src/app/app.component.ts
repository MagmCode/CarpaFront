import { Component, OnInit, OnDestroy } from '@angular/core';
import { SessionSyncService, SessionEvent } from './services/session-sync.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'nobleui-angular';
  private handlingLogout = false;

  private visibilityHandler = () => this.checkAuthAndRedirect();
  private focusHandler = () => this.checkAuthAndRedirect();

  constructor(private sessionSync: SessionSyncService, private router: Router) {}

  ngOnInit(): void {
    // React to session events from other tabs
    this.sessionSync.onEvent((ev: SessionEvent) => {
      if (!ev || !ev.type) return;
      if (ev.type === 'logout') {
        // If another tab requested logout, immediately cleanup and redirect
        this.performLogoutCleanup();
        // Close any open bootstrap modals and remove backdrops/classes that may remain
        try {
          // Hide Bootstrap modal instances
          document.querySelectorAll('.modal').forEach((m: any) => {
            try { (window as any).bootstrap?.Modal.getInstance(m)?.hide(); } catch (err) { /* ignore */ }
          });
          // Remove modal backdrops
          document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
          // Remove body classes that can keep UI elements visible
          document.body.classList.remove('modal-open', 'sidebar-open');
        } catch (err) {
          // ignore DOM cleanup errors
        }
        // Ensure we're at login screen; navigation handled by performLogoutCleanup
        this.performLogoutCleanup();
      }
      // Optionally handle 'login' or 'refresh' events if needed
    });

    // Listen for visibility / focus changes so a duplicated tab that becomes active checks auth state
    try {
      document.addEventListener('visibilitychange', this.visibilityHandler);
      window.addEventListener('focus', this.focusHandler);
    } catch (e) {
      // ignore
    }
  }

  ngOnDestroy(): void {
    try {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      window.removeEventListener('focus', this.focusHandler);
    } catch (e) {}
  }

  private checkAuthAndRedirect(): void {
    // If this tab becomes visible/focused, ensure it still has a token; if not, perform logout cleanup
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      if (!token) {
        this.performLogoutCleanup();
      }
    } catch (e) {
      // ignore
    }
  }

  private performLogoutCleanup(): void {
    if (this.handlingLogout) return;
    this.handlingLogout = true;
    try { sessionStorage.clear(); } catch (e) {}
    try { localStorage.clear(); } catch (e) {}
    // Close any open bootstrap modals and remove backdrops/classes that may remain
    try {
      document.querySelectorAll('.modal').forEach((m: any) => {
        try { (window as any).bootstrap?.Modal.getInstance(m)?.hide(); } catch (err) { /* ignore */ }
      });
      document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
      document.body.classList.remove('modal-open', 'sidebar-open');
    } catch (err) {}

    // Navigate to login (router preferred)
    try {
      this.router.navigate(['/auth/login']).then(() => {
        try { window.scrollTo(0, 0); } catch (e) {}
        this.handlingLogout = false;
      }).catch(() => { window.location.replace('/auth/login'); });
    } catch (e) {
      window.location.replace('/auth/login');
    }
  }

}
