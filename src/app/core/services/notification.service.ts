import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Notificacion {
  icon: string;
  texto: string;
  fecha: Date;
  tipo?: 'img';
  imgUrl?: string;
  ruta?: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private notificacionSubject = new Subject<Notificacion>();
  notificacion$ = this.notificacionSubject.asObservable();

  enviar(notificacion: Notificacion) {
    this.notificacionSubject.next(notificacion);
  }
}