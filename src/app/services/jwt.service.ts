import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * JWT Service
 * - Decodes JWT payload (base64url) without verifying signature.
 * - Exposes a BehaviorSubject with the current decoded payload so components can subscribe.
 * - Provides helpers: decodeToken, getClaim, isExpired, setToken, clear
 *
 * NOTE: Frontend cannot securely verify JWT signatures without the secret and it's not
 * recommended to store or use the secret in the client. This service only decodes the
 * token payload for convenience (non-verified). Do not rely on this for security decisions.
 */

export interface JwtPayload {
  exp?: number;
  iat?: number;
  sub?: string;
  [key: string]: any;
}

@Injectable({ providedIn: 'root' })
export class JwtService {
  private payloadSubject: BehaviorSubject<JwtPayload | null> = new BehaviorSubject<JwtPayload | null>(null);
  public payload$: Observable<JwtPayload | null> = this.payloadSubject.asObservable();
  // Normalized privileges as array of string URLs (derived from payload)
  private privilegesSubject: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
  public privileges$: Observable<string[]> = this.privilegesSubject.asObservable();

  constructor() {
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      if (token) this.setToken(token);
    } catch (e) {
      // ignore storage errors
    }
  }

  /** Decode a JWT and return the payload (no signature verification) */
  decodeToken(token: string): JwtPayload | null {
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;
      const payload = parts[1];
      // base64url -> base64
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      // add padding
      const pad = base64.length % 4;
      const padded = pad === 0 ? base64 : base64 + '='.repeat(4 - pad);
      const json = atob(padded);
      return JSON.parse(json) as JwtPayload;
    } catch (e) {
      return null;
    }
  }

  /** Set token and update observable */
  setToken(token: string | null): void {
    if (!token) {
      this.payloadSubject.next(null);
      this.privilegesSubject.next([]);
      return;
    }
    const decoded = this.decodeToken(token);
    this.payloadSubject.next(decoded);
    // derive normalized privileges immediately
    try {
      const p = decoded;
      const derived = this.normalizePrivilegesFromPayload(p);
      this.privilegesSubject.next(derived);
    } catch (e) {
      this.privilegesSubject.next([]);
    }
  }

  /** Clear stored payload */
  clear(): void {
    this.payloadSubject.next(null);
    this.privilegesSubject.next([]);
  }

  /** Normalize privileges from payload into array of string URLs */
  private normalizePrivilegesFromPayload(p: JwtPayload | null): string[] {
    if (!p) return [];
    // try multiple common claim names
    const candidates = [p['privileges'], p['privilegios'], p['privilegesList'], p['privilege_list'], p['roles']];
    let raw: any = null;
    for (const c of candidates) {
      if (c !== undefined && c !== null) { raw = c; break; }
    }

    // If nothing found, maybe the payload contains a nested 'usuario' with privileges
    if (!raw && typeof p['usuario'] === 'object') {
      raw = p['usuario']['privileges'] || p['usuario']['privilegios'] || p['usuario']['privilegesList'];
    }

    const out: string[] = [];

    const pushUrl = (u: any) => {
      if (!u && u !== '') return;
      let s = String(u).trim();
      if (!s) return;
      // ensure leading slash for consistency
      if (!s.startsWith('/')) s = '/' + s;
      out.push(s);
    };

    // If raw is a JSON string, try to parse
    if (typeof raw === 'string') {
      // try parse JSON
      try {
        const parsed = JSON.parse(raw);
        raw = parsed;
      } catch (e) {
        // not JSON: maybe comma separated
        raw.split(',').map((x: string) => x.trim()).filter((x: string) => x).forEach(pushUrl);
        return Array.from(new Set(out));
      }
    }

    // If array
    if (Array.isArray(raw)) {
      raw.forEach((item: any) => {
        if (!item) return;
        if (typeof item === 'string') return pushUrl(item);
        // object with url/path/route or direct value
        const url = item.url || item.path || item.route || item.name || item.alias || item;
        pushUrl(url);
      });
      return Array.from(new Set(out));
    }

    // If object with keys mapping to true/false
    if (typeof raw === 'object') {
      for (const k of Object.keys(raw)) {
        // value could be boolean or object
        const val = raw[k];
        if (val === true || val === 1 || typeof val === 'string' || typeof val === 'object') {
          pushUrl(k);
        }
      }
      return Array.from(new Set(out));
    }

    return [];
  }

  /** Get current payload synchronously */
  get payload(): JwtPayload | null {
    return this.payloadSubject.value;
  }

  /** Get a claim value by key */
  getClaim<T = any>(key: string): T | undefined {
    const p = this.payloadSubject.value;
    return p ? (p[key] as T) : undefined;
  }

  /** Check token expiration (exp in seconds since epoch) */
  isExpired(token?: string): boolean {
    const p = token ? this.decodeToken(token) : this.payloadSubject.value;
    if (!p) return true;
    if (!p.exp) return false; // no exp -> not expired by this check
    const now = Math.floor(Date.now() / 1000);
    return p.exp < now;
  }
}
