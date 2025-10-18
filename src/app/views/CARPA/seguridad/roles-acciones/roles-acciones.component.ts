

export interface Accion {
  url: string;
  descripcion: string;
  checked: boolean;
}

import { Component, OnInit } from '@angular/core';
import { AplicacionesService, Aplicacion } from 'src/app/services/aplicaciones-services/aplicaciones.service';
import { RolesService } from 'src/app/services/roles/roles.service';

export interface RolAccion {
  rol: string;
  descripcion: string;
  aplicacion: string;
}

@Component({
  selector: 'app-roles-acciones',
  templateUrl: './roles-acciones.component.html',
  styleUrls: ['./roles-acciones.component.scss']
})
export class RolesAccionesComponent implements OnInit {
  aplicaciones: Aplicacion[] = [];
  // roles will be loaded from backend via RolesService (we don't need the 'tipo' field here)
  roles: RolAccion[] = [];

  // Buscador y paginador para acciones
  accionesSearchTerm: string = '';
  accionesFiltradas: Accion[] = [];
  accionesPaginadas: Accion[] = [];
  accionesPage: number = 1;
  accionesPageSize: number = 10;
  accionesTotalPages: number = 1;

  // Estado para vista de asociación
  asociando: boolean = false;
  rolSeleccionado: RolAccion | null = null;
  acciones: Accion[] = [
    { url: '/usuarios/list', descripcion: 'Ver usuarios', checked: false },
    { url: '/usuarios/add', descripcion: 'Agregar usuario', checked: false },
    { url: '/inventario/list', descripcion: 'Ver inventario', checked: false },
    { url: '/inventario/add', descripcion: 'Agregar inventario', checked: false },
    { url: '/auditoria', descripcion: 'Ver auditoría', checked: false }
  ];

  // Paginación y búsqueda
  page: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;
  rolesFiltrados: RolAccion[] = [];
  rolesPaginados: RolAccion[] = [];
  searchTerm: string = '';

  // Ordenamiento
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(
    private aplicacionesService: AplicacionesService
    , private rolesService: RolesService
  ) { }

  ngOnInit(): void {
    this.aplicaciones = this.aplicacionesService.getAplicaciones ? this.aplicacionesService.getAplicaciones() : [];

    // load roles from backend and map to RolAccion (exclude 'tipo')
    this.rolesService.consultarRoles({}).subscribe({
      next: (resp: any) => {
        if (resp && Array.isArray(resp.data)) {
          this.roles = resp.data.map((r: any) => ({
            rol: r.rol || '',
            descripcion: r.descripcion || '',
            aplicacion: r.aplicacion || ''
          }));
        } else {
          console.warn('RolesAcciones: unexpected roles payload, using empty list', resp);
          this.roles = [];
        }
        this.filtrarRoles();
        this.filtrarAcciones();
      },
      error: (err) => {
        console.error('Error loading roles for RolesAcciones:', err);
        this.roles = [];
        this.filtrarRoles();
        this.filtrarAcciones();
      }
    });
  }
  filtrarAcciones(): void {
    if (this.accionesSearchTerm.trim()) {
      const term = this.accionesSearchTerm.trim().toLowerCase();
      this.accionesFiltradas = this.acciones.filter(a =>
        a.url.toLowerCase().includes(term) ||
        a.descripcion.toLowerCase().includes(term)
      );
    } else {
      this.accionesFiltradas = [...this.acciones];
    }
    this.accionesPage = 1;
    this.actualizarAccionesPaginacion();
  }

  actualizarAccionesPaginacion(): void {
    this.accionesTotalPages = Math.ceil(this.accionesFiltradas.length / this.accionesPageSize) || 1;
    const start = (this.accionesPage - 1) * this.accionesPageSize;
    const end = start + this.accionesPageSize;
    this.accionesPaginadas = this.accionesFiltradas.slice(start, end);
  }

  cambiarAccionesPagina(nuevaPagina: number): void {
    if (nuevaPagina < 1 || nuevaPagina > this.accionesTotalPages) return;
    this.accionesPage = nuevaPagina;
    this.actualizarAccionesPaginacion();
  }

  cambiarAccionesPageSize(nuevoSize: number): void {
    this.accionesPageSize = nuevoSize;
    this.accionesPage = 1;
    this.actualizarAccionesPaginacion();
  }

  filtrarRoles(): void {
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.trim().toLowerCase();
      this.rolesFiltrados = this.roles.filter(rol =>
        rol.rol.toLowerCase().includes(term) ||
        rol.descripcion.toLowerCase().includes(term) ||
        rol.aplicacion.toLowerCase().includes(term)
      );
    } else {
      this.rolesFiltrados = [...this.roles];
    }
    // Aplica ordenamiento si hay columna seleccionada
    if (this.sortColumn) {
      const col = this.sortColumn as keyof RolAccion;
      this.rolesFiltrados.sort((a, b) => {
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
    this.totalPages = Math.ceil(this.rolesFiltrados.length / this.pageSize) || 1;
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.rolesPaginados = this.rolesFiltrados.slice(start, end);
  }

  ordenarPor(col: string): void {
    if (this.sortColumn === col) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = col;
      this.sortDirection = 'asc';
    }
    this.filtrarRoles();
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

  asociarAcciones(rol: RolAccion): void {
    this.rolSeleccionado = rol;
    this.asociando = true;
    // Aquí podrías cargar las acciones asociadas al rol desde backend si aplica
  }

  cancelarAsociacion(): void {
    this.asociando = false;
    this.rolSeleccionado = null;
  }

  guardarAsociacion(): void {
    // Aquí podrías guardar la asociación en backend
    this.asociando = false;
    this.rolSeleccionado = null;
    // Opcional: mostrar mensaje de éxito
  }
}
