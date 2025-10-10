import { Injectable } from '@angular/core';

export interface Aplicacion {
  nombre: string;
  siglas: string;
  comentarios: string;
}

@Injectable({
  providedIn: 'root'
})
export class AplicacionesService {
  private aplicaciones: Aplicacion[] =[
    { nombre: 'Gestión Usuarios', siglas: 'GU', comentarios: 'Permite administrar usuarios del sistema' },
    { nombre: 'Inventario', siglas: 'INV', comentarios: 'Control de inventario de activos' }
  ];

  getAplicaciones(): Aplicacion[] {
    return this.aplicaciones;
  }

  constructor() { }
}
