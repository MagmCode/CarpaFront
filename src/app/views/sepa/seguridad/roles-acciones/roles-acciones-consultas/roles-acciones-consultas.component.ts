import { Component, OnInit, TemplateRef } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AplicacionesService, Aplicacion } from 'src/app/services/aplicaciones-services/aplicaciones.service';
import { Router } from '@angular/router';

interface Registro {
  alias: string;
  descripcion: string;
  aplicacion: string;
}

interface Accion {
  url: string;
  descripcion: string;
  aplicacion: string;
  seguridad: boolean | null;
  seleccionado?: boolean; 
}

@Component({
  selector: 'app-roles-acciones-consultas',
  templateUrl: './roles-acciones-consultas.component.html',
  styleUrls: ['./roles-acciones-consultas.component.scss']
})
export class RolesAccionesConsultasComponent implements OnInit {

  registros: Registro[] = [
    { alias: 'ADMIN', descripcion: 'Administrador del sistema', aplicacion: 'Gestión Usuarios' },
    { alias: 'INV', descripcion: 'Gestor de Inventario', aplicacion: 'Inventario' }
  ];

  acciones: Accion[] = [
    { url: '/usuarios', descripcion: 'Gestión de Usuarios', aplicacion: 'Gestión Usuarios', seguridad: null, seleccionado: false },
    { url: '/inventario', descripcion: 'Control de inventario', aplicacion: 'Inventario', seguridad: null, seleccionado: false }
  ];

  registroSeleccionado: Registro | null = null;
  accionSeleccionada: string = '';

  constructor(
    private modalService: NgbModal,
    private router: Router
  ) { }

  ngOnInit(): void {
  }

  verDetalles(registro: Registro, content: TemplateRef<any>) {
    this.registroSeleccionado = registro;
    this.accionSeleccionada = '';
    this.modalService.open(content, { centered: true });
  }

  regresar() {
    this.router.navigate(['/seguridad/roles-acciones']);
  }

}
