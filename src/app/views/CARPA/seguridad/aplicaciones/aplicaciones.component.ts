import { Component, OnInit, TemplateRef } from '@angular/core';
import Swal from 'sweetalert2';
import { DataTable } from "simple-datatables";
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';


export interface Aplicacion {
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



  // Paginación y búsqueda
  page: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;
  aplicacionesFiltradas: Aplicacion[] = [];
  aplicacionesPaginadas: Aplicacion[] = [];
  searchTerm: string = '';

  // Ordenamiento
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Modal y edición
  modalModo: 'agregar' | 'editar' = 'agregar';
  appSeleccionada: Aplicacion = { nombre: '', siglas: '', comentarios: '' };

  constructor(
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    this.filtrarAplicaciones();
  }
  ngAfterViewInit(): void {
    // Inicializa DataTable después de que la vista esté lista (opcional, si usas simple-datatables)
    // const dataTable = new DataTable("#aplicacionesTable");
  }


  filtrarAplicaciones(): void {
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.trim().toLowerCase();
      this.aplicacionesFiltradas = this.aplicaciones.filter(app =>
        app.nombre.toLowerCase().includes(term) ||
        app.siglas.toLowerCase().includes(term) ||
        app.comentarios.toLowerCase().includes(term)
      );
    } else {
      this.aplicacionesFiltradas = [...this.aplicaciones];
    }
    // Aplica ordenamiento si hay columna seleccionada
    if (this.sortColumn) {
      const col = this.sortColumn as keyof Aplicacion;
      this.aplicacionesFiltradas.sort((a, b) => {
        let valA = a[col] || '';
        let valB = b[col] || '';
        if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    this.page = 1;
    this.actualizarPaginacion();
  }

  actualizarPaginacion(): void {
    this.totalPages = Math.ceil(this.aplicacionesFiltradas.length / this.pageSize) || 1;
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.aplicacionesPaginadas = this.aplicacionesFiltradas.slice(start, end);
  }

  ordenarPor(col: string): void {
    if (this.sortColumn === col) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = col;
      this.sortDirection = 'asc';
    }
    this.filtrarAplicaciones();
  }


  cambiarPagina(nuevaPagina: number): void {
    if (nuevaPagina < 1 || nuevaPagina > this.totalPages) return;
    this.page = nuevaPagina;
    this.actualizarPaginacion();
  }


  cambiarPageSize(nuevoSize: number): void {
    this.pageSize = nuevoSize;
    this.page = 1;
    this.actualizarPaginacion();
  }
    exitMenu(): void {
    console.log('Salir del menú de aplicaciones');
  }

  openAddApplicationModal(content: TemplateRef<any>): void {
    this.modalModo = 'agregar';
    this.appSeleccionada = { nombre: '', siglas: '', comentarios: '' };
    this.modalService.open(content, { centered: true });
  }

  openEditApplicationModal(content: TemplateRef<any>, app: Aplicacion): void {
    this.modalModo = 'editar';
    this.appSeleccionada = { ...app };
    this.modalService.open(content, { centered: true });
  }


  saveApplication(modal: any): void {
    if (this.modalModo === 'agregar') {
      this.aplicaciones.push({ ...this.appSeleccionada });
    } else if (this.modalModo === 'editar') {
      const idx = this.aplicaciones.findIndex(a => a === this.aplicacionesPaginadas.find(ap => ap === this.appSeleccionada));
      if (idx > -1) {
        this.aplicaciones[idx] = { ...this.appSeleccionada };
      } else {
        // fallback: buscar por nombre y siglas
        const idx2 = this.aplicaciones.findIndex(a => a.nombre === this.appSeleccionada.nombre && a.siglas === this.appSeleccionada.siglas);
        if (idx2 > -1) this.aplicaciones[idx2] = { ...this.appSeleccionada };
      }
    }
    this.filtrarAplicaciones();
    modal.close();
  }

  deleteApplication(app: Aplicacion): void {
    Swal.fire({
      title: `¿Desea eliminar la aplicación "${app.nombre}"?`,
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.aplicaciones = this.aplicaciones.filter(a => a !== app);
        this.filtrarAplicaciones();
        Swal.fire({
          title: 'Eliminado',
          text: `La aplicación "${app.nombre}" ha sido eliminada.`,
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
  }
}