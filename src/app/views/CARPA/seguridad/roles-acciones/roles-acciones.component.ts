

export interface Accion {
  url: string;
  descripcion: string;
  checked: boolean;
  applicationName?: string;
}

import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { AccionesService } from 'src/app/services/acciones/acciones.service';
import { AplicacionesService, Aplicacion } from 'src/app/services/aplicaciones-services/aplicaciones.service';
import { RolesService } from 'src/app/services/roles/roles.service';

export interface RolAccion {
  id: number;
  rol: string;
  descripcion: string;
  aplicacion: string;
  siglasAplic: string;
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

  loading = false;

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
  acciones: Accion[] = [];

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
  private aplicacionesService: AplicacionesService,
  private rolesService: RolesService,
  private accionesService: AccionesService
  ) { }

  ngOnInit(): void {
    this.aplicaciones = this.aplicacionesService.getAplicaciones ? this.aplicacionesService.getAplicaciones() : [];

    this.loading = true;
    // load roles from backend and map to RolAccion (exclude 'tipo')
    this.rolesService.consultarRoles({}).subscribe({
      next: (resp: any) => {
        if (resp && Array.isArray(resp.data)) {
          this.roles = resp.data.map((r: any) => ({
            id: r.id,
            rol: r.rol || '',
            descripcion: r.descripcion || '',
            aplicacion: r.aplicacion || '',
            siglasAplic: r.siglasAplic || ''
          }));
        } else {
          console.warn('RolesAcciones: unexpected roles payload, using empty list', resp);
          this.roles = [];
        }
        this.filtrarRoles();
        this.filtrarAcciones();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading roles for RolesAcciones:', err);
        this.roles = [];
        this.filtrarRoles();
        this.filtrarAcciones();
        this.loading = false;
        Swal.fire({ title: 'Error', text: 'No se pudieron cargar los roles.', icon: 'error' });
      }
    });
    this.loading = true;
    // Consultar acciones desde el backend y mapear para la tabla
    this.accionesService.buscar({}).subscribe({
      next: (resp: any) => {
        const data = resp && resp.data ? resp.data : resp;
        this.acciones = (Array.isArray(data) ? data : []).map((a: any) => ({
          url: a.url,
          descripcion: a.description,
          checked: false
        }));
        this.filtrarAcciones();
        this.loading = false;
      },
      error: () => {
        this.acciones = [];
        this.filtrarAcciones();
        this.loading = false;
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
    this.loading = true;
    // Consultar todas las acciones
    this.accionesService.buscar({}).subscribe({
      next: (resp: any) => {
        let accionesFiltradas = resp && resp.data ? resp.data : resp;
        // Filtrar por siglasAplic directamente
        const sigla = rol.siglasAplic ? rol.siglasAplic.toLowerCase() : '';
        if (sigla) {
          accionesFiltradas = (Array.isArray(accionesFiltradas) ? accionesFiltradas : []).filter(a => (a.applicationName && a.applicationName.toLowerCase() === sigla));
          console.log('Acciones filtradas por sigla:', sigla, accionesFiltradas);
        }
        // Consultar acciones asociadas al rol
        this.rolesService.buscarAccionesPorRol({ mscRoleId: rol.id }).subscribe({
          next: (accionesResp: any) => {
            const seleccionados: number[] = Array.isArray(accionesResp?.data) ? accionesResp.data : [];
            this.acciones = (Array.isArray(accionesFiltradas) ? accionesFiltradas : []).map((a: any) => ({
              url: a.url,
              descripcion: a.description,
              applicationName: a.applicationName,
              checked: seleccionados.includes(a.idAction)
            }));
            this.filtrarAcciones();
            this.loading = false;
          },
          error: () => {
            this.loading = false;
            Swal.fire({ title: 'Error', text: 'No se pudieron cargar las acciones asociadas.', icon: 'error' });
            this.acciones = (Array.isArray(accionesFiltradas) ? accionesFiltradas : []).map((a: any) => ({
              url: a.url,
              descripcion: a.description,
              applicationName: a.applicationName,
              checked: false
            }));
            this.filtrarAcciones();
          }
        });
      },
      error: () => {
        this.acciones = [];
        this.filtrarAcciones();
        this.loading = false;
        Swal.fire({ title: 'Error', text: 'No se pudieron cargar las acciones.', icon: 'error' });
      }
    });
  }

  cancelarAsociacion(): void {
    this.asociando = false;
    this.rolSeleccionado = null;
  }

  guardarAsociacion(): void {
    // Obtener el id del rol seleccionado (de backend)
    const idRole = (this.rolSeleccionado as any)?.id;
    // Obtener los id de las acciones seleccionadas
    const idAcciones: number[] = [];
    // Buscar en la lista original de acciones (de backend)
    const accionesBackend = this.accionesService.getAcciones();
    for (const accion of this.acciones) {
      if (accion.checked) {
        // Buscar el idAction por url y descripcion
        const found = accionesBackend.find((a: any) => a.url === accion.url && a.description === accion.descripcion);
        if (found && found.idAction) {
          idAcciones.push(found.idAction);
        }
      }
    }
    if (!idRole || !idAcciones.length) {
      // Opcional: mostrar error si falta info
      console.warn('No hay rol o acciones seleccionadas para asociar');
      this.asociando = false;
      this.rolSeleccionado = null;
      return;
    }
    console.log('Enviando asociación:', { idRole, idAcciones });
    const payload = { mscRoleId: idRole, idAcciones };
    // Llamar al backend para guardar la asociación
    this.rolesService.rolesAcciones(payload).subscribe({
      next: (resp: any) => {
        console.log('Asociación exitosa:', resp);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Asociación realizada con éxito',
          showConfirmButton: false,
          timer: 2500
        });
      },
      error: (err: any) => {
        console.error('Error al asociar acciones:', err);
        // Opcional: mostrar mensaje de error
      }
    });
    this.asociando = false;
    this.rolSeleccionado = null;
  }
}
