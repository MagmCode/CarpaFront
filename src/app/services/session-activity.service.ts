import { Injectable, NgZone } from '@angular/core';
import { SessionSyncService } from './session-sync.service';
import { environment } from 'src/environments/environment';

/**
 * SessionActivityService
 * - Tracks user activity (mouse/keyboard/touch/scroll) and triggers logout after inactivity
 * - Listens for tab/window unload and attempts a sendBeacon logout, clears storage and broadcasts logout
 */
@Injectable({ providedIn: 'root' })
export class SessionActivityService {
  // 1 minute inactivity timeout
  private readonly INACTIVITY_MS = 60 * 1000;
  private timeoutId: any = null;
  private started = false;

  // list of event types to treat as activity
  private readonly activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];

  // handlers bound so they can be removed cleanly
  private boundActivityHandler = () => this.resetTimer();
  private boundBeforeUnload = (ev: BeforeUnloadEvent) => this.handleBeforeUnload(ev);

  constructor(private sessionSync: SessionSyncService, private ngZone: NgZone) {}

  start(): void {
    if (this.started) return;
    this.started = true;
    // run listeners outside Angular to reduce change-detection churn
    this.ngZone.runOutsideAngular(() => {
      this.activityEvents.forEach(e => window.addEventListener(e, this.boundActivityHandler, { passive: true } as any));
      window.addEventListener('beforeunload', this.boundBeforeUnload);
      window.addEventListener('unload', this.boundBeforeUnload);
    });
    this.resetTimer();
  }

  stop(): void {
    if (!this.started) return;
    this.started = false;
    this.activityEvents.forEach(e => window.removeEventListener(e, this.boundActivityHandler as any));
    window.removeEventListener('beforeunload', this.boundBeforeUnload as any);
    window.removeEventListener('unload', this.boundBeforeUnload as any);
    this.clearTimer();
  }

  resetTimer(): void {
    this.clearTimer();
    this.timeoutId = setTimeout(() => {
      try { this.logoutDueToInactivity(); } catch (e) { /* ignore */ }
    }, this.INACTIVITY_MS);
  }

  private clearTimer(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  private logoutDueToInactivity(): void {
    // broadcast logout and clear storage; AppComponent will react to the broadcast and redirect
    try {
      this.notifyServerLogout();
    } catch (e) {}
    try { sessionStorage.clear(); } catch (e) {}
    try { localStorage.removeItem('token'); localStorage.removeItem('refreshToken'); } catch (e) {}
    try {
      this.sessionSync.broadcast({ type: 'logout' });
    } catch (e) {}
    // perform a navigation replacement to login so user can't go back
    try { window.location.replace('/auth/login'); } catch (e) { /* ignore */ }
  }

  private handleBeforeUnload(ev?: BeforeUnloadEvent): void {
    try {
      // Attempt to notify backend synchronously using sendBeacon if available
      this.notifyServerLogout();
    } catch (e) {
      // ignore
    }
    // Ensure storages are cleared so reopening won't restore session
    try { sessionStorage.clear(); } catch (e) {}
    try { localStorage.removeItem('token'); localStorage.removeItem('refreshToken'); } catch (e) {}
    try { this.sessionSync.broadcast({ type: 'logout' }); } catch (e) {}
    // Note: don't call preventDefault() — we don't want to show a navigation prompt
  }

  private notifyServerLogout(): void {
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      if (!token) return;
      const url = `${environment.Url}/auth/logout`;
      const sendBeaconAvailable = typeof navigator !== 'undefined' && typeof (navigator as any).sendBeacon === 'function';
      const fetchAvailable = typeof fetch === 'function';

      // 1) sendBeacon with JSON body (best-effort and most reliable during unload)
      if (sendBeaconAvailable) {
        try {
          const payload = JSON.stringify({ token });
          const blob = new Blob([payload], { type: 'application/json' });
          (navigator as any).sendBeacon(url, blob);
        } catch (e) {
          // ignore and try other fallbacks
        }
      }

      // 2) fetch with keepalive and Authorization header (if backend expects header)
      if (fetchAvailable) {
        try {
          // keepalive requests may be honored by the browser even during unload in many modern browsers
          fetch(url, {
            method: 'POST',
            keepalive: true as any,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `${token}`
            },
            body: JSON.stringify({})
          }).catch(() => { /* swallow */ });
        } catch (e) {
          // ignore
        }
      }

      // 3) fetch with keepalive and token in body (some backends accept token in payload)
      if (fetchAvailable) {
        try {
          fetch(url, {
            method: 'POST',
            keepalive: true as any,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
          }).catch(() => { /* swallow */ });
        } catch (e) {}
      }

      // 4) As a last fallback, create an Image ping with token in query string (very best-effort)
      try {
        const img = new Image();
        img.src = `${url}?token=${encodeURIComponent(token)}&ts=${Date.now()}`;
      } catch (e) {
        // ignore
      }
    } catch (e) {
      // ignore any errors — logout still proceeds locally
    }
  }
}
