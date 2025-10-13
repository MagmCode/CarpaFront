import { Component, OnInit, TemplateRef } from '@angular/core';
import { AplicacionesService, Aplicacion } from 'src/app/services/aplicaciones-services/aplicaciones.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-acciones',
  templateUrl: './acciones.component.html',
  styleUrls: ['./acciones.component.scss']
})
export class AccionesComponent implements OnInit {
  aplicaciones: Aplicacion[] = [];

  acciones: { url: string; descripcion: string; aplicacion: string }[] = [
    { url: '/usuarios', descripcion: 'Gestión de usuarios', aplicacion: 'Gestión Usuarios' },
    { url: '/inventario', descripcion: 'Control de inventario', aplicacion: 'Inventario' },
    { url: '/reportes', descripcion: 'Reportes del sistema', aplicacion: 'Gestión Usuarios' },
    { url: '/movimientos', descripcion: 'Movimientos de inventario', aplicacion: 'Inventario' }
  ];

  // Paginación y búsqueda
  page: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;
  accionesFiltradas: { url: string; descripcion: string; aplicacion: string }[] = [];
  accionesPaginadas: { url: string; descripcion: string; aplicacion: string }[] = [];
  searchTerm: string = '';

  // Ordenamiento
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Modal y edición
  modalModo: 'agregar' | 'editar' = 'agregar';
  newAction: { url: string; descripcion: string; aplicacion: string } = { url: '', descripcion: '', aplicacion: '' };
  accionSeleccionada: { url: string; descripcion: string; aplicacion: string } | null = null;

  constructor(
    private aplicacionesService: AplicacionesService,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    this.aplicaciones = this.aplicacionesService.getAplicaciones();
    this.filtrarAcciones();
  }

  filtrarAcciones(): void {
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.trim().toLowerCase();
      this.accionesFiltradas = this.acciones.filter(a =>
        a.url.toLowerCase().includes(term) ||
        a.descripcion.toLowerCase().includes(term) ||
        a.aplicacion.toLowerCase().includes(term)
      );
    } else {
      this.accionesFiltradas = [...this.acciones];
    }
    // Aplica ordenamiento si hay columna seleccionada
    if (this.sortColumn) {
      const col = this.sortColumn as keyof typeof this.acciones[0];
      this.accionesFiltradas.sort((a, b) => {
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
    this.totalPages = Math.ceil(this.accionesFiltradas.length / this.pageSize) || 1;
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.accionesPaginadas = this.accionesFiltradas.slice(start, end);
  }

  ordenarPor(col: string): void {
    if (this.sortColumn === col) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = col;
      this.sortDirection = 'asc';
    }
    this.filtrarAcciones();
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
    console.log('Salir del menú de acciones');
  }

  openAddActionModal(content: TemplateRef<any>) {
    this.modalModo = 'agregar';
    this.newAction = { url: '', descripcion: '', aplicacion: '' };
    this.modalService.open(content, { centered: true });
  }

  openEditActionModal(content: TemplateRef<any>, accion: { url: string; descripcion: string; aplicacion: string }) {
    this.modalModo = 'editar';
    this.newAction = { ...accion };
    this.accionSeleccionada = accion;
    this.modalService.open(content, { centered: true });
  }

  saveAction(modal: any) {
    if (this.modalModo === 'agregar') {
      this.acciones.push({ ...this.newAction });
    } else if (this.modalModo === 'editar' && this.accionSeleccionada) {
      const idx = this.acciones.findIndex(a => a === this.accionSeleccionada);
      if (idx > -1) {
        this.acciones[idx] = { ...this.newAction };
      }
    }
    this.filtrarAcciones();
    modal.close();
  }

  deleteAccion(accion: { url: string; descripcion: string; aplicacion: string }): void {
    Swal.fire({
      title: `¿Desea eliminar la acción?`,
      text: `URL: ${accion.url}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.acciones = this.acciones.filter(a => a !== accion);
        this.filtrarAcciones();
        Swal.fire({
          title: 'Eliminado',
          text: `La acción ha sido eliminada.`,
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
  }
}

