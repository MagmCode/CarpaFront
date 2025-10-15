import { Component, OnInit } from '@angular/core';
import { AplicacionesService, Aplicacion } from 'src/app/services/aplicaciones-services/aplicaciones.service';

interface OpcionMenu {
  nombre: string;
  subOpciones: string[];
}

interface MenuPorRol {
  opcionesMenu: OpcionMenu[];
  aplicacion: string;
  rol: string;
}

@Component({
  selector: 'app-opciones-menu-por-rol',
  templateUrl: './opciones-menu-por-rol.component.html',
  styleUrls: ['./opciones-menu-por-rol.component.scss']
})
export class OpcionesMenuPorRolComponent implements OnInit {

  aplicaciones: Aplicacion[] = [];
  appRolSeleccionado: string = '';
  appRolUnicos: string[] = [];
  
  datos: MenuPorRol[] = [
  {
      opcionesMenu: [
        { nombre: 'Configuración', subOpciones: ['Usuarios', 'Parámetros', 'Seguridad'] },
        { nombre: 'Informes', subOpciones: ['Reporte Diario', 'Reporte Mensual'] },
        { nombre: 'Reportes', subOpciones: ['Reporte Anual', ' Reporte Especial'] }
      ],
      aplicacion: 'Gestión Usuarios',
      rol: 'ADMIN'
    },
    {
      opcionesMenu: [
        { nombre: 'Liquidación', subOpciones: ['Pagos', 'Cobros'] },
        { nombre: 'Ordenes', subOpciones: ['Crear Orden', 'Ver Ordenes'] }
      ],
      aplicacion: 'Inventario',
      rol: 'INV_ADMIN'
    },
    {
      opcionesMenu: [
        { nombre: 'Configuración', subOpciones: ['Usuarios'] }
      ],
      aplicacion: 'Gestión Usuarios',
      rol: 'USER'
    },
    {
      opcionesMenu: [
        { nombre: 'Informes', subOpciones: ['Reporte Diario'] }
      ],
      aplicacion: 'Inventario',
      rol: 'INV_USER'
    }    
  ];

  datosFiltrados: MenuPorRol[] = [];
  rolesUnicos: string[] = [];

  constructor(
    private aplicacionesService: AplicacionesService
  ) { }

  currentPage: number = 1;
  pageSize: number = 10;
  totalRows: number = 0;
  totalPages: number = 0;
  pagesArray: number[] = [];
  paginatedRows: any[] = [];

  ngOnInit(): void {
    this.aplicaciones = this.aplicacionesService.getAplicaciones();
    this.appRolUnicos = Array.from(new Set(this.datos.map(d => `${d.aplicacion} - ${d.rol}`)));
    this.datosFiltrados = [...this.datos];
    this.updatePagination();
  }

  filtrarDatos() {
  if (!this.appRolSeleccionado) {
      this.datosFiltrados = [...this.datos];
  } else {
      this.datosFiltrados = this.datos.filter(item =>
        `${item.aplicacion} - ${item.rol}` === this.appRolSeleccionado
      );
    }
    this.currentPage = 1;
    this.updatePagination();
  }

  getAllRows(): any[] {
    const rows: any[] = [];
    for (const item of this.datosFiltrados) {
      for (const opcion of item.opcionesMenu) {
        rows.push({
          tipo: 'opcion',
          nombre: opcion.nombre,
          aplicacion: item.aplicacion,
          rol: item.rol
        });
        for (const sub of opcion.subOpciones) {
          rows.push({
            tipo: 'subopcion',
            nombre: sub,
            aplicacion: item.aplicacion,
            rol: item.rol
          });
        }
      }
    }
    return rows;
  }

  updatePagination() {
    const allRows = this.getAllRows();
    this.totalRows = allRows.length;
    this.totalPages = Math.ceil(this.totalRows / this.pageSize);
    this.pagesArray = Array(this.totalPages).fill(0).map((x, i) => i + 1);
    const start = (this.currentPage - 1) * this.pageSize;
    this.paginatedRows = allRows.slice(start, start + this.pageSize);
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.updatePagination();
  }
}
