
import { Component, OnInit, TemplateRef } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { AplicacionesService, Aplicacion } from 'src/app/services/aplicaciones-services/aplicaciones.service';

export interface Rol {
  rol: string;
  descripcion: string;
  tipo: string;
  aplicacion: string;
}

@Component({
  selector: 'app-roles',
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.scss']
})
export class RolesComponent implements OnInit {
  aplicaciones: Aplicacion[] = [];
  roles: Rol[] = [
    { rol: 'Administrador', descripcion: 'Acceso total al sistema', tipo: 'usuarios de la torre', aplicacion: 'Gestión Usuarios' },
    { rol: 'Operador', descripcion: 'Acceso limitado', tipo: 'usuarios de red comercial', aplicacion: 'Inventario' },
    { rol: 'Consulta', descripcion: 'Solo lectura', tipo: 'usuarios de la torre', aplicacion: 'Gestión Usuarios' },
    { rol: 'Supervisor', descripcion: 'Supervisa operaciones', tipo: 'usuarios de red comercial', aplicacion: 'Inventario' },
    { rol: 'Auditor', descripcion: 'Auditoría de acciones', tipo: 'usuarios de la torre', aplicacion: 'Gestión Usuarios' },
    { rol: 'Soporte', descripcion: 'Soporte técnico', tipo: 'usuarios de red comercial', aplicacion: 'Inventario' },
    { rol: 'Invitado', descripcion: 'Acceso restringido', tipo: 'usuarios de la torre', aplicacion: 'Gestión Usuarios' },
    { rol: 'Analista', descripcion: 'Análisis de datos', tipo: 'usuarios de red comercial', aplicacion: 'Inventario' },
    { rol: 'Desarrollador', descripcion: 'Desarrollo de software', tipo: 'usuarios de la torre', aplicacion: 'Gestión Usuarios' },
    { rol: 'Tester', descripcion: 'Pruebas de sistema', tipo: 'usuarios de red comercial', aplicacion: 'Inventario' },
    { rol: 'Líder', descripcion: 'Liderazgo de equipo', tipo: 'usuarios de la torre', aplicacion: 'Gestión Usuarios' },
    { rol: 'Usuario', descripcion: 'Usuario estándar', tipo: 'usuarios de red comercial', aplicacion: 'Inventario' }
  ];

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
  newRole: Rol = { rol: '', descripcion: '', tipo: '', aplicacion: '' };

  constructor(
    private aplicacionesService: AplicacionesService,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    this.aplicaciones = this.aplicacionesService.getAplicaciones ? this.aplicacionesService.getAplicaciones() : [];
    this.filtrarRoles();
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
    this.newRole = { rol: '', descripcion: '', tipo: '', aplicacion: '' };
    this.modalService.open(content, { centered: true });
  }

  openEditRoleModal(content: TemplateRef<any>, rol: Rol): void {
    this.modalModo = 'editar';
    this.newRole = { ...rol };
    this.modalService.open(content, { centered: true });
  }

  saveRole(modal: any): void {
    if (this.modalModo === 'agregar') {
      this.roles.push({ ...this.newRole });
    } else if (this.modalModo === 'editar') {
      const idx = this.roles.findIndex(r => r === this.rolesPaginados.find(rp => rp === this.newRole));
      if (idx > -1) {
        this.roles[idx] = { ...this.newRole };
      } else {
        // fallback: buscar por rol, tipo y aplicacion
        const idx2 = this.roles.findIndex(r => r.rol === this.newRole.rol && r.tipo === this.newRole.tipo && r.aplicacion === this.newRole.aplicacion);
        if (idx2 > -1) this.roles[idx2] = { ...this.newRole };
      }
    }
    this.filtrarRoles();
    modal.close();
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