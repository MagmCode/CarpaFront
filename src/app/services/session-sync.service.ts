export type SessionEvent = { type: 'login' | 'logout' | 'refresh'; payload?: any };

/**
 * SessionSyncService
 * - Uses BroadcastChannel when available to broadcast session events between tabs
 * - Falls back to localStorage + storage event when BroadcastChannel isn't available
 */
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SessionSyncService {
  private bc?: BroadcastChannel;
  private readonly STORAGE_KEY = '__carpa_session_event__';
  private listeners: Array<(ev: SessionEvent) => void> = [];

  constructor() {
    try {
      if (typeof (window as any).BroadcastChannel === 'function') {
        this.bc = new BroadcastChannel('srd-session');
        this.bc.onmessage = (ev: MessageEvent) => this.handleMessage(ev.data);
      } else {
        window.addEventListener('storage', (e: StorageEvent) => this.handleStorageEvent(e));
      }
    } catch (e) {
      // ignore if BroadcastChannel is not allowed
      window.addEventListener('storage', (e: StorageEvent) => this.handleStorageEvent(e));
    }
  }

  onEvent(fn: (ev: SessionEvent) => void): void {
    this.listeners.push(fn);
  }

  broadcast(ev: SessionEvent): void {
    try {
      if (this.bc) {
        this.bc.postMessage(ev);
      } else {
        // Use localStorage as a cross-tab transport; write+remove to trigger storage event
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(ev));
        // Keep a small delay then remove the key to avoid leaving data behind
        setTimeout(() => {
          try { localStorage.removeItem(this.STORAGE_KEY); } catch (e) {}
        }, 50);
      }
    } catch (e) {
      // ignore
    }
  }

  private handleMessage(data: any) {
    try {
      const obj = data as SessionEvent;
      this.listeners.forEach(l => l(obj));
    } catch (e) {
      // ignore
    }
  }

  private handleStorageEvent(e: StorageEvent) {
    if (!e.key) return;
    if (e.key !== this.STORAGE_KEY) return;
    if (!e.newValue) return;
    try {
      const obj = JSON.parse(e.newValue) as SessionEvent;
      this.listeners.forEach(l => l(obj));
    } catch (err) {
      // ignore
    }
  }
}
