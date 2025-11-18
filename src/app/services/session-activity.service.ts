import { Injectable, NgZone } from '@angular/core';
import { SessionSyncService } from './session-sync.service';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';

/**
 * SessionActivityService
 * - Tracks user activity (mouse/keyboard/touch/scroll) and triggers logout after inactivity
 * - Listens for tab/window unload and attempts a sendBeacon logout, clears storage and broadcasts logout
 */
@Injectable({ providedIn: 'root' })
export class SessionActivityService {
  // default inactivity timeout (fallback) — will be overridden from token exp when available
  private INACTIVITY_MS = 300 * 1000;
  private timeoutId: any = null;
  private started = false;
  // flag to indicate an extend-session prompt is currently shown
  private promptActive = false;
  

  
 // key para sincronizar actividad entre pestañas
 private readonly LAST_ACTIVITY_KEY = '__last_activity__';
 // checker que valida inactivity global periódicamente
 private globalCheckerId: any = null;


  // list of event types to treat as activity
  private readonly activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];

  // handlers bound so they can be removed cleanly
  private boundActivityHandler = () => this.resetTimer();
  private boundBeforeUnload = (ev: BeforeUnloadEvent) => this.handleBeforeUnload(ev);
  private boundStorageHandler = (ev: StorageEvent) => this.handleStorageEvent(ev);

  // unique id for this tab (stored in sessionStorage)
  private tabId: string = '';
  // heartbeat interval id
  private heartbeatId: any = null;
  // last timestamp when user triggered a reload-like key combination
  private lastReloadIntentTs: number = 0;
  // reload detection window (ms)
  private readonly RELOAD_INTENT_WINDOW = 1500;

  constructor(private sessionSync: SessionSyncService, private ngZone: NgZone) {}

  start(): void {
    if (this.started) return;
    this.started = true;
    // ensure tabId exists for this tab (session-scoped)
    try {
      const existing = sessionStorage.getItem('__carpa_tab_id__');
      this.tabId = existing || Math.random().toString(36).slice(2);
      try { sessionStorage.setItem('__carpa_tab_id__', this.tabId); } catch (e) { /* ignore */ }
    } catch (e) { this.tabId = Math.random().toString(36).slice(2); }

    // run listeners outside Angular to reduce change-detection churn
    this.ngZone.runOutsideAngular(() => {
      this.activityEvents.forEach(e => window.addEventListener(e, this.boundActivityHandler, { passive: true } as any));
      window.addEventListener('beforeunload', this.boundBeforeUnload);
      window.addEventListener('unload', this.boundBeforeUnload);
      window.addEventListener('storage', this.boundStorageHandler as any);
      // capture reload key combos (F5, Ctrl/Meta+R)
      window.addEventListener('keydown', this.handleKeydown as any);
    });
    this.resetTimer();

   // publicar actividad inicial (para sincronizar entre pestañas)
   try { localStorage.setItem(this.LAST_ACTIVITY_KEY, String(Date.now())); } catch (e) { /* ignore */ }
   // iniciar checker global que comprueba última actividad en todas las pestañas
   try { this.globalCheckerId = setInterval(() => this.checkGlobalInactivity(), 2000); } catch (e) { /* ignore */ }


  // If we are reloading this tab, signal cancel so other tabs don't treat this as a close
    try {
      const navEntries = (performance && (performance as any).getEntriesByType) ? (performance as any).getEntriesByType('navigation') : null;
      const navType = (navEntries && navEntries[0] && navEntries[0].type) ? navEntries[0].type : (window.performance && (window.performance as any).navigation ? (window.performance as any).navigation.type : null);
      const isReload = navType === 'reload' || navType === 1;
      if (isReload) {
        // write a short-lived cancel flag for our tabId
        const cancelKey = `__tab_unload_cancelled__:${this.tabId}`;
        try { localStorage.setItem(cancelKey, String(Date.now())); } catch (e) {}
        setTimeout(() => { try { localStorage.removeItem(cancelKey); } catch (e) {} }, 2000);
      }
    } catch (e) { /* ignore */ }

    // start heartbeat to indicate this tab is alive (used to detect single-tab scenarios)
    try {
      this.sendHeartbeat();
      this.heartbeatId = setInterval(() => this.sendHeartbeat(), 2000);
    } catch (e) { /* ignore */ }
  }

  stop(): void {
    if (!this.started) return;
    this.started = false;
    this.activityEvents.forEach(e => window.removeEventListener(e, this.boundActivityHandler as any));
    window.removeEventListener('beforeunload', this.boundBeforeUnload as any);
    window.removeEventListener('unload', this.boundBeforeUnload as any);
    window.removeEventListener('storage', this.boundStorageHandler as any);
    try { window.removeEventListener('keydown', this.handleKeydown as any); } catch (e) {}
    this.clearTimer();
    try { if (this.globalCheckerId) { clearInterval(this.globalCheckerId); this.globalCheckerId = null; } } catch (e) {}
    try { if (this.heartbeatId) { clearInterval(this.heartbeatId); this.heartbeatId = null; } } catch (e) {}
    // remove own alive key
    try { localStorage.removeItem(`__tab_alive__:${this.tabId}`); } catch (e) {}
  }

  resetTimer(): void {
    this.clearTimer();
    // If there's no session token, don't schedule inactivity checks (we're likely on login page)
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    if (!token) {
      // keep timers cleared while unauthenticated
      return;
    }
    // compute current inactivity interval (may be derived from token exp)
    const ms = this.computeInactivityMsFromToken() || this.INACTIVITY_MS;
    this.timeoutId = setTimeout(() => {
      try { this.handleInactivityTimeout(); } catch (e) { /* ignore */ }
    }, ms);
 // anunciar actividad globalmente para que otras pestañas reinicien su contador
 try { localStorage.setItem(this.LAST_ACTIVITY_KEY, String(Date.now())); } catch (e) { /* ignore */ }
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
    // Do NOT notify server here synchronously: that causes reloads to invalidate the session.
    // Instead, announce unloading via localStorage and let other tabs perform the server logout
    // if the unload is not cancelled (i.e. it's a real close). This avoids treating reload as logout.
    // Determine number of alive tabs (recent heartbeats)
    let aliveCount = 0;
    try {
      const now = Date.now();
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        if (k.startsWith('__tab_alive__:')) {
          const v = localStorage.getItem(k);
          const ts = v ? parseInt(v, 10) : 0;
          if (ts && now - ts < 5000) aliveCount++;
        }
      }
    } catch (e) { /* ignore */ }

    const nowTs = Date.now();
    const recentReloadIntent = (nowTs - (this.lastReloadIntentTs || 0)) < this.RELOAD_INTENT_WINDOW;

    if (aliveCount <= 1) {
      // single-tab scenario: if user likely intended a reload (recent key combo), skip server logout
      if (!recentReloadIntent) {
        // best-effort: notify server synchronously via sendBeacon/fetch keepalive
        try {
          this.notifyServerLogout();
        } catch (e) { /* ignore */ }
        // mark that a logout was requested (persistent) so a restored tab will detect it and redirect to login
        try { localStorage.setItem('__session_logout_requested__', JSON.stringify({ tabId: this.tabId, ts: Date.now() })); } catch (e) { /* ignore */ }
      }
      // still announce unload so others (if any) can react
    } else {
      // multi-tab: announce unload and let other tabs decide after handshake
      try {
        const key = '__tab_unloading__';
        const payload = JSON.stringify({ tabId: this.tabId, ts: Date.now() });
        try { localStorage.setItem(key, payload); } catch (e) { /* ignore */ }
        // leave the payload for a short time then remove to avoid clutter
        setTimeout(() => { try { localStorage.removeItem(key); } catch (e) {} }, 2000);
      } catch (e) { /* ignore */ }
    }
    // Note: don't call preventDefault() — we don't want to show a navigation prompt
  }

  private handleStorageEvent(ev: StorageEvent): void {
    try {
      if (!ev.key) return;
     // si otra pestaña reportó actividad, reiniciamos timer local
     if (ev.key === this.LAST_ACTIVITY_KEY) {
       this.resetTimer();
       return;
     }
      if (ev.key === '__tab_unloading__' && ev.newValue) {
        // another tab announced unload; schedule a short wait to see if it's a reload
        try {
          const data = JSON.parse(ev.newValue as string);
          const leavingTabId = data?.tabId;
          if (!leavingTabId || leavingTabId === this.tabId) return;
          // wait 1.5s for a possible cancel flag written by a reloading tab
          setTimeout(() => {
            try {
              const cancelKey = `__tab_unload_cancelled__:${leavingTabId}`;
              const canceled = localStorage.getItem(cancelKey);
              if (canceled) {
                try { localStorage.removeItem(cancelKey); } catch (e) {}
                return; // it was a reload, ignore
              }
              // Not canceled -> treat as real tab close and logout
              this.logoutDueToExternalTabClose(leavingTabId);
            } catch (e) { /* ignore */ }
          }, 1500);
        } catch (e) { /* ignore parse errors */ }
      }
    } catch (e) { /* ignore */ }
  }

  
      // Chequeo periódico de última actividad global (por si setTimeout/intervals están throttled)
  private checkGlobalInactivity(): void {
    try {
      // if a prompt is currently active, don't force logout from the global checker
      if (this.promptActive) return;

      // if not logged in, skip inactivity enforcement
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      if (!token) return;

      const v = localStorage.getItem(this.LAST_ACTIVITY_KEY);
      if (!v) return;
      const lastTs = parseInt(v, 10) || 0;
      const now = Date.now();
      const ms = this.computeInactivityMsFromToken() || this.INACTIVITY_MS;
      if (now - lastTs > ms) {
        // no actividad global -> cerrar sesión
        this.clearTimer();
        try { this.logoutDueToInactivity(); } catch (e) { /* ignore */ }
      }
    } catch (e) { /* ignore */ }
  }

  /**
   * Compute inactivity interval (ms) from token 'exp' claim divided by 3.
   * Returns null if token/exp not available or already expired.
   */
  private computeInactivityMsFromToken(): number | null {
    try {
      // read token from session/local storage
      let token = sessionStorage.getItem('token') || localStorage.getItem('token');
      if (!token) return null;
      // If token stored as 'Bearer <jwt>' strip prefix
      if (token.startsWith('Bearer ')) token = token.slice(7);
      const parts = token.split('.');
      if (parts.length < 2) return null;
      const payload = parts[1];
      const json = this.base64UrlDecode(payload);
      const obj = JSON.parse(json || '{}');
      const exp = obj && (obj.exp || obj.exp === 0) ? Number(obj.exp) : null;
      if (!exp) return null;
      // exp is usually in seconds since epoch
      const expMs = exp * 1000;
      const now = Date.now();
      const remaining = expMs - now;
      if (remaining <= 0) {
        // token already expired -> force logout immediately
        try { this.logoutDueToInactivity(); } catch (e) { /* ignore */ }
        return null;
      }
      // inactivity threshold is one third of remaining lifetime
      const ms = Math.floor(remaining / 3);
      // ensure we give at least a small window to show the prompt (5s)
      return Math.max(5000, ms);
    } catch (e) {
      // on any parse error, fallback to default
      return Math.floor(this.INACTIVITY_MS / 3);
    }
  }

  private base64UrlDecode(input: string): string {
    // base64url -> base64
    let s = input.replace(/-/g, '+').replace(/_/g, '/');
    // pad
    while (s.length % 4) s += '=';
    try {
      return decodeURIComponent(Array.prototype.map.call(atob(s), (c: string) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
    } catch (e) {
      // fallback
      return atob(s);
    }
  }

  /**
   * Called when inactivity threshold reached. Shows a 5s prompt to extend session.
   * If user accepts within 5s -> reset timers. Otherwise -> logout.
   */
  private async handleInactivityTimeout(): Promise<void> {
    try {
      // If not logged in, don't show prompts
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      if (!token) return;
      // mark prompt active and bump last-activity so the global checker won't logout while the Swal is visible
      this.promptActive = true;
      try { localStorage.setItem(this.LAST_ACTIVITY_KEY, String(Date.now())); } catch (e) { /* ignore */ }

      // show a SweetAlert2 prompt with 5s timer; if user confirms -> extend session
      const result = await Swal.fire({
        title: '¿Desea extender la sesión?',
        showCancelButton: true,
        confirmButtonText: 'Extender',
        cancelButtonText: 'Cancelar',
        timer: 5000,
        timerProgressBar: true,
        allowOutsideClick: false,
        allowEscapeKey: false,
      });

      // clear promptActive regardless of outcome
      this.promptActive = false;

      if (result && (result as any).isConfirmed) {
        // accepted -> treat as activity
        this.resetTimer();
        try { localStorage.setItem(this.LAST_ACTIVITY_KEY, String(Date.now())); } catch (e) { /* ignore */ }
      } else {
        // not accepted or timer elapsed -> logout
        try { this.logoutDueToInactivity(); } catch (e) { /* ignore */ }
      }
    } catch (e) { /* ignore */ }
  }

  // The previous custom DOM prompt was removed in favor of SweetAlert2 (Swal.fire).

  private logoutDueToExternalTabClose(leavingTabId: string): void {
    try {
      // attempt to notify backend (best-effort)
      this.notifyServerLogout();
    } catch (e) {}
    // mark logout requested so restored tabs won't retain session
    try { localStorage.setItem('__session_logout_requested__', JSON.stringify({ tabId: leavingTabId, ts: Date.now() })); } catch (e) { /* ignore */ }
    try { sessionStorage.clear(); } catch (e) {}
    try { localStorage.removeItem('token'); localStorage.removeItem('refreshToken'); } catch (e) {}
    try { this.sessionSync.broadcast({ type: 'logout' }); } catch (e) {}
    try { window.location.replace('/auth/login'); } catch (e) {}
  }

  private handleKeydown = (ev: KeyboardEvent) => {
    try {
      const k = ev.key;
      const isF5 = k === 'F5';
      const isCtrlR = (k === 'r' || k === 'R') && (ev.ctrlKey || ev.metaKey);
      if (isF5 || isCtrlR) {
        this.lastReloadIntentTs = Date.now();
      }
    } catch (e) { /* ignore */ }
  }

  private sendHeartbeat(): void {
    try {
      const key = `__tab_alive__:${this.tabId}`;
      try { localStorage.setItem(key, String(Date.now())); } catch (e) { /* ignore */ }
      // clean up stale heartbeats older than 10s to avoid clutter
      try {
        const now = Date.now();
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (!k) continue;
          if (k.startsWith('__tab_alive__:')) {
            const v = localStorage.getItem(k);
            const ts = v ? parseInt(v, 10) : 0;
            if (ts && now - ts > 10000) {
              try { localStorage.removeItem(k); } catch (e) {}
            }
          }
        }
      } catch (e) { /* ignore */ }
    } catch (e) { /* ignore */ }
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
