import { Component, OnInit, TemplateRef } from '@angular/core';
import { AplicacionesService, Aplicacion } from 'src/app/services/aplicaciones-services/aplicaciones.service';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

export interface RolMenu {
  id: number;
  rol: string;
  descripcion: string;
  aplicacion: string;
}

export interface Accion {
  url: string;
  descripcion: string;
  checked: boolean;
}

export interface MenuOption {
  id: number;
  nombreMenu: string;
  url: string;
  orden: number;
  aplicaciones: string;
  checked: boolean;
  hijos?: MenuOption[];
  expanded?: boolean; // UI expand/collapse
}

@Component({
  selector: 'app-roles-menu',
  templateUrl: './roles-menu.component.html',
  styleUrls: ['./roles-menu.component.scss']
})
export class RolesMenuComponent implements OnInit {
  aplicaciones: Aplicacion[] = [];

  roles: RolMenu[] = [
    { id: 1, rol: 'Administrador', descripcion: 'Acceso total', aplicacion: 'Gestión Usuarios' },
    { id: 2, rol: 'Operador', descripcion: 'Acceso limitado', aplicacion: 'Inventario' },
    { id: 3, rol: 'Consulta', descripcion: 'Solo lectura', aplicacion: 'Gestión Usuarios' },
    { id: 4, rol: 'Supervisor', descripcion: 'Supervisa operaciones', aplicacion: 'Inventario' }
  ];

  // Paginación y búsqueda para la tabla principal
  page: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;
  rolesFiltrados: RolMenu[] = [];
  rolesPaginados: RolMenu[] = [];
  searchTerm: string = '';

  // Ordenamiento
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Estado para vista de asociación
  asociando: boolean = false;
  rolSeleccionado: RolMenu | null = null;

  // Opciones de menú jerárquicas para la asociación
  menuOptions: MenuOption[] = [
    {
      id: 1,
      nombreMenu: 'Dashboard',
      url: '/dashboard',
      orden: 1,
      aplicaciones: 'Gestión Usuarios',
      checked: false,
      hijos: [
        { id: 11, nombreMenu: 'Inicio', url: '/dashboard/home', orden: 1, aplicaciones: 'Gestión Usuarios', checked: false },
        // Profundidad 4 de ejemplo: 1 -> 1.2 -> 1.2.1 -> 1.2.1.2
        {
          id: 12,
          nombreMenu: '1.2',
          url: '/dashboard/1.2',
          orden: 2,
          aplicaciones: 'Gestión Usuarios',
          checked: false,
          hijos: [
            {
              id: 121,
              nombreMenu: '1.2.1',
              url: '/dashboard/1.2/1.2.1',
              orden: 1,
              aplicaciones: 'Gestión Usuarios',
              checked: false,
              hijos: [
                { id: 1212, nombreMenu: '1.2.1.2', url: '/dashboard/1.2/1.2.1/1.2.1.2', orden: 1, aplicaciones: 'Gestión Usuarios', checked: false }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 2,
      nombreMenu: 'Usuarios',
      url: '/usuarios',
      orden: 2,
      aplicaciones: 'Gestión Usuarios',
      checked: false,
      hijos: [
        { id: 21, nombreMenu: 'Listado', url: '/usuarios/list', orden: 1, aplicaciones: 'Gestión Usuarios', checked: false },
        { id: 22, nombreMenu: 'Crear', url: '/usuarios/create', orden: 2, aplicaciones: 'Gestión Usuarios', checked: false }
      ]
    },
    {
      id: 3,
      nombreMenu: 'Inventario',
      url: '/inventario',
      orden: 3,
      aplicaciones: 'Inventario',
      checked: false,
      hijos: [
        { id: 31, nombreMenu: 'Productos', url: '/inventario/productos', orden: 1, aplicaciones: 'Inventario', checked: false },
      ]
    }
  ];

  // newRole para el modal de añadir/editar
  newRole: { rol: string; descripcion: string; tipo: string; aplicacion: string } = { rol: '', descripcion: '', tipo: '', aplicacion: '' };

  // Buscador para menú en la vista de asociación
  menuSearchTerm: string = '';
  menuFiltradas: MenuOption[] = [];
  menuPaginadas: MenuOption[] = []; // paginated top-level items for display
  menuVisibleIds: Set<number> = new Set<number>();
  // Sort state for association menu
  menuSortColumn: string = '';
  menuSortDirection: 'asc' | 'desc' = 'asc';

  constructor(
    private aplicacionesService: AplicacionesService,
    private router: Router,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    this.aplicaciones = this.aplicacionesService.getAplicaciones ? this.aplicacionesService.getAplicaciones() : [];
    this.filtrarRoles();
    this.filtrarMenu();
  }

  // Tabla principal
  filtrarRoles(): void {
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.trim().toLowerCase();
      this.rolesFiltrados = this.roles.filter(r =>
        r.rol.toLowerCase().includes(term) ||
        r.descripcion.toLowerCase().includes(term) ||
        r.aplicacion.toLowerCase().includes(term)
      );
    } else {
      this.rolesFiltrados = [...this.roles];
    }
    if (this.sortColumn) {
      const col = this.sortColumn as keyof RolMenu;
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

  // Asociar acciones
  asociarAcciones(rol: RolMenu): void {
    this.rolSeleccionado = rol;
    this.asociando = true;
    // aquí podrías cargar asociaciones del backend
    // inicializar el filtro de menú cuando se abre la vista
    this.filtrarMenu();
  }

  cancelarAsociacion(): void {
    this.asociando = false;
    this.rolSeleccionado = null;
  }

  guardarAsociacion(): void {
    // Guardar en backend si aplica
    this.asociando = false;
    this.rolSeleccionado = null;
  }

  // Menú jerárquico: filtrado recursivo
  filtrarMenu(): void {
    const term = this.menuSearchTerm.trim().toLowerCase();
    this.menuVisibleIds.clear();

    const checkRecursive = (items: MenuOption[]): boolean => {
      let anyVisible = false;
      for (const it of items) {
        const hijoVisible = it.hijos ? checkRecursive(it.hijos) : false;
        const match = it.nombreMenu.toLowerCase().includes(term) || it.url.toLowerCase().includes(term) || it.aplicaciones.toLowerCase().includes(term);
        if (term === '' || match || hijoVisible) {
          this.menuVisibleIds.add(it.id);
          // expand nodes that match or have matching descendants so user sees context
          it.expanded = !!(hijoVisible || match || term === '');
          anyVisible = true;
        }
      }
      return anyVisible;
    };

    checkRecursive(this.menuOptions);
    // Prepare top-level list to render (only top-level items that are visible)
    this.menuFiltradas = this.menuOptions.filter(it => this.menuVisibleIds.has(it.id));
    // reset pagination
    this.menuPage = 1;
    this.actualizarMenuPaginacion();
  }

  // Propaga check/uncheck a hijos recursivamente
  toggleCheck(item: MenuOption, checked: boolean): void {
    item.checked = checked;
    if (item.hijos && item.hijos.length) {
      for (const h of item.hijos) {
        this.toggleCheck(h, checked);
      }
    }
  }

  // Paginación para la vista de asociación (top-level nodes)
  menuPage: number = 1;
  menuPageSize: number = 5;
  menuTotalPages: number = 1;

  actualizarMenuPaginacion(): void {
    this.menuTotalPages = Math.max(1, Math.ceil(this.menuFiltradas.length / this.menuPageSize));
    const start = (this.menuPage - 1) * this.menuPageSize;
    const end = start + this.menuPageSize;
    this.menuPaginadas = this.menuFiltradas.slice(start, end);
  }

  cambiarMenuPagina(nuevaPagina: number): void {
    if (nuevaPagina < 1 || nuevaPagina > this.menuTotalPages) return;
    this.menuPage = nuevaPagina;
    this.actualizarMenuPaginacion();
  }

  cambiarMenuPageSize(nuevoSize: number): void {
    this.menuPageSize = nuevoSize;
    this.menuPage = 1;
    this.actualizarMenuPaginacion();
  }

  // Ordenamiento recursivo del árbol por una columna (por ejemplo 'aplicaciones')
  ordenarMenuPor(col: string): void {
    if (this.menuSortColumn === col) {
      this.menuSortDirection = this.menuSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.menuSortColumn = col;
      this.menuSortDirection = 'asc';
    }
    const compare = (a: any, b: any) => {
      const valA = (a[col] || '').toString().toLowerCase();
      const valB = (b[col] || '').toString().toLowerCase();
      if (valA < valB) return this.menuSortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return this.menuSortDirection === 'asc' ? 1 : -1;
      return 0;
    };

    const sortRecursive = (items: MenuOption[] | undefined) => {
      if (!items || !items.length) return;
      items.sort(compare as any);
      for (const it of items) {
        if (it.hijos && it.hijos.length) sortRecursive(it.hijos);
      }
    };

    sortRecursive(this.menuOptions);
    // re-filter to update visible set and view
    this.filtrarMenu();
  }

  // Mantener modal de añadir rol si es necesario
  openAddRoleModal(content: TemplateRef<any>) {
    this.modalService.open(content, { centered: true });
  }

  addRole(modal: any) {
    modal.close();
  }

  consultar() {
    this.router.navigate(['/seguridad/roles-menu/consultas']);
  }

  salir() {
    // acción de salida
  }
}