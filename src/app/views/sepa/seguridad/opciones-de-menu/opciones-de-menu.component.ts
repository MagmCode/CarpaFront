import { Component, OnInit, AfterViewInit, TemplateRef } from '@angular/core';
import { DataTable } from "simple-datatables";
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AplicacionesService, Aplicacion } from 'src/app/services/aplicaciones-services/aplicaciones.service';

interface OpcionMenu {
  nombreMenu: string;
  url: string;
  padre: string;
  nivel: number;
  orden: number;
  aplicaciones: string;
  checked: boolean;
}

@Component({
  selector: 'app-opciones-de-menu',
  templateUrl: './opciones-de-menu.component.html',
  styleUrls: ['./opciones-de-menu.component.scss']
})
export class OpcionesDeMenuComponent implements OnInit, AfterViewInit {

  opciones: OpcionMenu[] = [
    {
      nombreMenu: 'Usuarios',
      url: '/usuarios',
      padre: 'Seguridad',
      nivel: 1,
      orden: 10,
      aplicaciones: 'Gestión Usuarios',
      checked: false
    },
    {
      nombreMenu: 'Inventario',
      url: '/inventario',
      padre: 'Operaciones',
      nivel: 2,
      orden: 20,
      aplicaciones: 'Control Inventario',
      checked: false
    },
     {
      nombreMenu: 'Usuarios',
      url: '/usuarios',
      padre: 'Seguridad',
      nivel: 1,
      orden: 10,
      aplicaciones: 'Gestión Usuarios',
      checked: false
    },
    {
      nombreMenu: 'Inventario',
      url: '/inventario',
      padre: 'Operaciones',
      nivel: 2,
      orden: 20,
      aplicaciones: 'Control Inventario',
      checked: false
    },
     {
      nombreMenu: 'Usuarios',
      url: '/usuarios',
      padre: 'Seguridad',
      nivel: 1,
      orden: 10,
      aplicaciones: 'Gestión Usuarios',
      checked: false
    },
    {
      nombreMenu: 'Inventario',
      url: '/inventario',
      padre: 'Operaciones',
      nivel: 2,
      orden: 20,
      aplicaciones: 'Control Inventario',
      checked: false
    },
     {
      nombreMenu: 'Usuarios',
      url: '/usuarios',
      padre: 'Seguridad',
      nivel: 1,
      orden: 10,
      aplicaciones: 'Gestión Usuarios',
      checked: false
    },
    {
      nombreMenu: 'Inventario',
      url: '/inventario',
      padre: 'Operaciones',
      nivel: 2,
      orden: 20,
      aplicaciones: 'Control Inventario',
      checked: false
    },
     {
      nombreMenu: 'Usuarios',
      url: '/usuarios',
      padre: 'Seguridad',
      nivel: 1,
      orden: 10,
      aplicaciones: 'Gestión Usuarios',
      checked: false
    },
    {
      nombreMenu: 'Inventario',
      url: '/inventario',
      padre: 'Operaciones',
      nivel: 2,
      orden: 20,
      aplicaciones: 'Control Inventario',
      checked: false
    },
     {
      nombreMenu: 'Usuarios',
      url: '/usuarios',
      padre: 'Seguridad',
      nivel: 1,
      orden: 10,
      aplicaciones: 'Gestión Usuarios',
      checked: false
    },
    {
      nombreMenu: 'Inventario',
      url: '/inventario',
      padre: 'Operaciones',
      nivel: 2,
      orden: 20,
      aplicaciones: 'Control Inventario',
      checked: false
    },
     {
      nombreMenu: 'Usuarios',
      url: '/usuarios',
      padre: 'Seguridad',
      nivel: 1,
      orden: 10,
      aplicaciones: 'Gestión Usuarios',
      checked: false
    },
    {
      nombreMenu: 'Inventario',
      url: '/inventario',
      padre: 'Operaciones',
      nivel: 2,
      orden: 20,
      aplicaciones: 'Control Inventario',
      checked: false
    }
    // Agrega más datos de prueba si lo necesitas
  ];

  aplicaciones: Aplicacion[] = [];

  newApp: OpcionMenu = { nombreMenu: '', url: '', padre: '', nivel: 1, orden: 1, aplicaciones: '', checked: false };

  constructor(
    private modalService: NgbModal,
    private aplicacionesService: AplicacionesService
  ) { }

  ngOnInit(): void {
    this.aplicaciones = this.aplicacionesService.getAplicaciones();
  }

  ngAfterViewInit(): void {
    const dataTable = new DataTable("#opcionesMenuTable");
    }
  exitMenu(): void {
      console.log('Salir del menú de aplicaciones');
    }
  openAddApplicationModal(content: TemplateRef<any>): void {
      this.newApp = { nombreMenu: '', url: '', padre: '', nivel: 0, orden: 0, aplicaciones: '', checked:false };
      this.modalService.open(content, { centered: true });
    }
  
  addApplication(modal: any): void {
      this.opciones.push({ ...this.newApp });
      modal.close();
    }
}