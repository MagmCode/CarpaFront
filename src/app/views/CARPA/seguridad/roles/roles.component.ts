
import { Component, OnInit, TemplateRef } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { AplicacionesService, Aplicacion } from 'src/app/services/aplicaciones-services/aplicaciones.service';
import { RolesService } from 'src/app/services/roles/roles.service';

export interface Rol {
  id: number;
  rol: string;
  descripcion: string;
  tipo: string;
  aplicacion: string;
  siglasAplic?: string;
}

@Component({
  selector: 'app-roles',
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.scss']
})
export class RolesComponent implements OnInit {

  public submitted = false;

  loading = false;
  aplicaciones: Aplicacion[] = [];
  // roles will be loaded from backend via RolesService
  roles: Rol[] = [];

  // Paginación y búsqueda
  page: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;
  rolesFiltrados: Rol[] = [];
  rolesPaginados: Rol[] = [];
  searchTerm: string = '';

  // Ordenamiento
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Modal y edición
  modalModo: 'agregar' | 'editar' = 'agregar';
  newRole: Rol = { id: 0, rol: '', descripcion: '', tipo: '', aplicacion: '' };

  constructor(
    private aplicacionesService: AplicacionesService,
    private modalService: NgbModal,
    private rolesService: RolesService
  ) { }

  ngOnInit(): void {
    // Suscribirse a la lista de aplicaciones y cargar desde backend
    this.aplicacionesService.getAplicaciones$().subscribe(apps => {
      this.aplicaciones = apps || [];
    });
    this.aplicacionesService.loadAplicaciones().subscribe({ next: () => {}, error: () => {} });

    // request roles from backend and populate the table
    this.loading = true;
    this.rolesService.consultarRoles({}).subscribe({
      next: (resp: any) => {
        if (resp && Array.isArray(resp.data)) {
          this.roles = resp.data;
        } else {
          console.warn('RolesService returned unexpected payload, falling back to empty list', resp);
          this.roles = [];
        }
        this.filtrarRoles();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching roles from backend:', err);
        this.roles = [];
        this.filtrarRoles();
        this.loading = false;
        Swal.fire({ title: 'Error', text: 'No se pudieron cargar los roles.', icon: 'error' });
      }
    });
  }

  filtrarRoles(): void {
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.trim().toLowerCase();
      this.rolesFiltrados = this.roles.filter(rol =>
        rol.rol.toLowerCase().includes(term) ||
        rol.descripcion.toLowerCase().includes(term) ||
        rol.tipo.toLowerCase().includes(term) ||
        rol.aplicacion.toLowerCase().includes(term)
      );
    } else {
      this.rolesFiltrados = [...this.roles];
    }
    // Aplica ordenamiento si hay columna seleccionada
    if (this.sortColumn) {
      const col = this.sortColumn as keyof Rol;
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


  openAddRoleModal(content: TemplateRef<any>): void {
    this.modalModo = 'agregar';
    this.newRole = { id: 0, rol: '', descripcion: '', tipo: '', aplicacion: '' };
    this.modalService.open(content, { centered: true });
  }

  openEditRoleModal(content: TemplateRef<any>, rol: Rol): void {
    this.modalModo = 'editar';
    // Buscar el id de la aplicación por nombre/siglas
    let appId = '';
    if (rol.aplicacion) {
      const app = this.aplicaciones.find(a => a.siglasApplic === rol.aplicacion || a.description === rol.aplicacion);
      if (app) appId = String(app.idApplication);
    }
    // Normalizar el tipo
    let tipo = '';
    if (rol.tipo) {
      if (rol.tipo.toLowerCase().includes('torre')) tipo = 'usuarios de la torre';
      else if (rol.tipo.toLowerCase().includes('red')) tipo = 'usuarios de red comercial';
      else tipo = rol.tipo;
    }
    this.newRole = {
      id: rol.id,
      rol: rol.rol,
      descripcion: rol.descripcion,
      tipo: tipo,
      aplicacion: appId
    };
    this.modalService.open(content, { centered: true });
  }

  saveRole(modal: any, roleForm: any): void {
    if (!roleForm.valid) {
      return;
    }
    if (this.modalModo === 'agregar') {
      // Construir el payload para el backend
      const appObj = this.aplicaciones.find(a => a.idApplication === Number(this.newRole.aplicacion));
      const payload = {
        roleName: this.newRole.rol,
        description: this.newRole.descripcion,
        inUsoEnRed: this.newRole.tipo === 'usuarios de la torre' ? 0 : 1,
        idApplication: appObj ? appObj.idApplication : null
      };
      this.loading = true;
      this.rolesService.crearRol(payload).subscribe({
        next: (resp: any) => {
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Rol creado',
            text: payload.roleName,
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
          });
          // Recargar roles desde backend
          this.rolesService.consultarRoles({}).subscribe({
            next: (r: any) => {
              this.roles = Array.isArray(r.data) ? r.data : [];
              this.filtrarRoles();
              this.loading = false;
            },
            error: () => {
              this.loading = false;
            }
          });
          modal.close();
        },
        error: (err: any) => {
          this.loading = false;
          if (err && err.message.includes('El rol ya existe')) {
            Swal.fire({
            toast: false,
            position: 'center',
            icon: 'warning',
            title: 'Rol ya existe',
            text: "Este rol ya existe para la aplicación seleccionada.",
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: false
          });
          } else {

          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: 'Error al crear rol',
            text: (err && err.message) ? err.message : JSON.stringify(err),
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true
          });
        }
        }
      });
    } else if (this.modalModo === 'editar') {
      // Construir el payload para modificar rol
      const appObj = this.aplicaciones.find(a => a.idApplication === Number(this.newRole.aplicacion));
      const payload = {
        mscRoleId: this.newRole.id,
        roleName: this.newRole.rol,
        description: this.newRole.descripcion,
        inUsoEnRed: this.newRole.tipo === 'usuarios de la torre' ? 0 : 1,
        idApplication: appObj ? appObj.idApplication : null
      };
      this.loading = true;
      this.rolesService.modificarRol(payload).subscribe({
        next: (resp: any) => {
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Rol modificado',
            text: payload.roleName,
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
          });
          // Recargar roles desde backend
          this.rolesService.consultarRoles({}).subscribe({
            next: (r: any) => {
              this.roles = Array.isArray(r.data) ? r.data : [];
              this.filtrarRoles();
              this.loading = false;
            },
            error: () => {
              this.loading = false;
            }
          });
          modal.close();
        },
        error: (err: any) => {
          this.loading = false;
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: 'Error al modificar rol',
            text: (err && err.message) ? err.message : JSON.stringify(err),
            showConfirmButton: false,
            timer: 4000,
            timerProgressBar: true
          });
        }
      });
    }
  }

  deleteRole(rol: Rol): void {
    Swal.fire({
      title: `¿Desea eliminar el rol "${rol.rol}"?`,
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.roles = this.roles.filter(r => r !== rol);
        this.filtrarRoles();
        Swal.fire({
          title: 'Eliminado',
          text: `El rol "${rol.rol}" ha sido eliminado.`,
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
  }
}