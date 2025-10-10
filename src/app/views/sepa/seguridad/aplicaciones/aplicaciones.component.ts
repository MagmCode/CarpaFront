import { Component, OnInit, TemplateRef } from '@angular/core';
import { DataTable } from "simple-datatables";
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';


interface Aplicacion {
  nombre: string;
  siglas: string;
  comentarios: string;
}

@Component({
  selector: 'app-aplicaciones',
  templateUrl: './aplicaciones.component.html',
  styleUrls: ['./aplicaciones.component.scss']
})
export class AplicacionesComponent implements OnInit {

  aplicaciones: Aplicacion[] = [
    {
      nombre: 'Gestión Usuarios',
      siglas: 'GU',
      comentarios: 'Permite administrar usuarios del sistema'
    },
    {
      nombre: 'Inventario',
      siglas: 'INV',
      comentarios: 'Control de inventario de activos'
    },
     {
      nombre: 'Gestión Usuarios',
      siglas: 'GU',
      comentarios: 'Permite administrar usuarios del sistema'
    },
    {
      nombre: 'Inventario',
      siglas: 'INV',
      comentarios: 'Control de inventario de activos'
    },
     {
      nombre: 'Gestión Usuarios',
      siglas: 'GU',
      comentarios: 'Permite administrar usuarios del sistema'
    },
    {
      nombre: 'Inventario',
      siglas: 'INV',
      comentarios: 'Control de inventario de activos'
    },
     {
      nombre: 'Gestión Usuarios',
      siglas: 'GU',
      comentarios: 'Permite administrar usuarios del sistema'
    },
    {
      nombre: 'Inventario',
      siglas: 'INV',
      comentarios: 'Control de inventario de activos'
    },
     {
      nombre: 'Gestión Usuarios',
      siglas: 'GU',
      comentarios: 'Permite administrar usuarios del sistema'
    },
    {
      nombre: 'Inventario',
      siglas: 'INV',
      comentarios: 'Control de inventario de activos'
    },
     {
      nombre: 'Gestión Usuarios',
      siglas: 'GU',
      comentarios: 'Permite administrar usuarios del sistema'
    },
    {
      nombre: 'Inventario',
      siglas: 'INV',
      comentarios: 'Control de inventario de activos'
    }
    // Puedes agregar más datos de prueba aquí
  ];

    newApp: Aplicacion = { nombre: '', siglas: '', comentarios: '' };

  constructor(
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
  }
  ngAfterViewInit(): void {
    // Inicializa DataTable después de que la vista esté lista
    const dataTable = new DataTable("#aplicacionesTable");
  }
    exitMenu(): void {
    console.log('Salir del menú de aplicaciones');
  }
  openAddApplicationModal(content: TemplateRef<any>): void {
    this.newApp = { nombre: '', siglas: '', comentarios: '' };
    this.modalService.open(content, { centered: true });
  }

  addApplication(modal: any): void {
    this.aplicaciones.push({ ...this.newApp });
    modal.close();
    // Si necesitas refrescar la tabla de DataTable, deberás reinicializarla aquí
  }
}