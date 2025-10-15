import { Component, OnInit, TemplateRef } from '@angular/core';
import { AplicacionesService, Aplicacion } from 'src/app/services/aplicaciones-services/aplicaciones.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';

interface OpcionMenu {
  nombre: string;
  seleccionado: boolean; 
}

interface Registro {
  id: number;
  alias: string;
  descripcion: string;
  aplicacion: string;
  opcionesMenu: OpcionMenu[];
}

interface NuevoRol {
  rol: string;
  descripcion: string;
  tipo: string;
  aplicacion: string;
}

@Component({
  selector: 'app-roles-menu-consultas',
  templateUrl: './roles-menu-consultas.component.html',
  styleUrls: ['./roles-menu-consultas.component.scss']
})
export class RolesMenuConsultasComponent implements OnInit {

  aplicaciones: Aplicacion[] = [];
  registros: Registro[] = [];

  registroSeleccionado: Registro | null = null;
  accionSeleccionada: string = '';

  constructor(
    private aplicacionesService: AplicacionesService,
    private modalService: NgbModal,
    private router: Router
  ) { }

  newRole: NuevoRol = { rol: '', descripcion: '', tipo: '', aplicacion: '' };
  

  ngOnInit(): void {
    this.aplicaciones = this.aplicacionesService.getAplicaciones();
    this.registros = [
    { 
      id: 1, 
      alias: 'ADMIN', 
      descripcion: 'Administrador del sistema', 
      aplicacion: this.aplicaciones[0]?.nombre || '',
      opcionesMenu: [
        { nombre: 'Dashboard', seleccionado: false },
        { nombre: 'Reportes', seleccionado: false },
        { nombre: 'Configuracion', seleccionado: false },
        { nombre: 'Usuarios', seleccionado: false }
      ]
    },
    { 
      id: 2, 
      alias: 'INV', 
      descripcion: 'Gestor de Inventario', 
      aplicacion: this.aplicaciones[1]?.nombre ||'', 
      opcionesMenu: [
        { nombre: 'Dashboard', seleccionado: false },
        { nombre: 'Reportes', seleccionado: false },
        { nombre: 'Configuracion', seleccionado: false },
        { nombre: 'Usuarios', seleccionado: false }
      ]
    }
    ];
  }

  verDetalles(registro: Registro, content: TemplateRef<any>) {
    this.registroSeleccionado = registro;
    this.accionSeleccionada = '';
    this.modalService.open(content, { centered: true });
  }

  openAddRoleModal(content: any) {
    this.newRole = { rol: '', descripcion: '', tipo: '', aplicacion: '' };
    this.modalService.open(content, { centered: true });
  }

  addRole(modal: any) {
    modal.close();
  }

  regresar() {
    this.modalService.dismissAll();
    this.router.navigate(['/seguridad/roles-menu']);
  }
}
