import { Component, OnInit, TemplateRef } from '@angular/core';
import Swal from 'sweetalert2';
import { AplicacionesService, Aplicacion } from 'src/app/services/aplicaciones-services/aplicaciones.service';
import { RolesService } from 'src/app/services/roles/roles.service';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MenuService } from 'src/app/services/menu/menu.service';

export interface RolMenu {
  id: number;
  rol: string;
  descripcion: string;
  tipo: string;
  aplicacion: string;
  siglasAplic: string;
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
  loading = false;

  roles: RolMenu[] = [
    // will be populated from backend
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
    // {
    //   id: 1,
    //   nombreMenu: 'Dashboard',
    //   url: '/dashboard',
    //   orden: 1,
    //   aplicaciones: 'Gestión Usuarios',
    //   checked: false,
    //   hijos: [
    //     { id: 11, nombreMenu: 'Inicio', url: '/dashboard/home', orden: 1, aplicaciones: 'Gestión Usuarios', checked: false },
    //     // Profundidad 4 de ejemplo: 1 -> 1.2 -> 1.2.1 -> 1.2.1.2
    //     {
    //       id: 12,
    //       nombreMenu: '1.2',
    //       url: '/dashboard/1.2',
    //       orden: 2,
    //       aplicaciones: 'Gestión Usuarios',
    //       checked: false,
    //       hijos: [
    //         {
    //           id: 121,
    //           nombreMenu: '1.2.1',
    //           url: '/dashboard/1.2/1.2.1',
    //           orden: 1,
    //           aplicaciones: 'Gestión Usuarios',
    //           checked: false,
    //           hijos: [
    //             { id: 1212, nombreMenu: '1.2.1.2', url: '/dashboard/1.2/1.2.1/1.2.1.2', orden: 1, aplicaciones: 'Gestión Usuarios', checked: false }
    //           ]
    //         }
    //       ]
    //     }
    //   ]
    // },
    // {
    //   id: 2,
    //   nombreMenu: 'Usuarios',
    //   url: '/usuarios',
    //   orden: 2,
    //   aplicaciones: 'Gestión Usuarios',
    //   checked: false,
    //   hijos: [
    //     { id: 21, nombreMenu: 'Listado', url: '/usuarios/list', orden: 1, aplicaciones: 'Gestión Usuarios', checked: false },
    //     { id: 22, nombreMenu: 'Crear', url: '/usuarios/create', orden: 2, aplicaciones: 'Gestión Usuarios', checked: false }
    //   ]
    // },
    // {
    //   id: 3,
    //   nombreMenu: 'Inventario',
    //   url: '/inventario',
    //   orden: 3,
    //   aplicaciones: 'Inventario',
    //   checked: false,
    //   hijos: [
    //     { id: 31, nombreMenu: 'Productos', url: '/inventario/productos', orden: 1, aplicaciones: 'Inventario', checked: false },
    //   ]
    // }
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
    private modalService: NgbModal,
    private rolesService: RolesService,
    private menuService: MenuService
  ) { }

  ngOnInit(): void {
    this.aplicaciones = this.aplicacionesService.getAplicaciones ? this.aplicacionesService.getAplicaciones() : [];

    this.loading = true;
    // load roles from backend and map to RolMenu[] (generate numeric ids)
    this.rolesService.consultarRoles({}).subscribe({
      next: (resp: any) => {
        if (resp && Array.isArray(resp.data)) {
          this.roles = resp.data.map((r: any, idx: number) => ({
            id: r.id,
            rol: r.rol || '',
            descripcion: r.descripcion || '',
            aplicacion: r.aplicacion || '',
            siglasAplic: r.siglasAplic || ''
          }));
        } else {
          console.warn('RolesMenu: unexpected roles payload, using empty list', resp);
          this.roles = [];
        }
        this.filtrarRoles();
        this.filtrarMenu();
        this.loading = false;
      },
      error: (err: any) => {
        console.error('RolesMenu: error loading roles', err);
        this.loading = false;
        // fallback to local defaults to keep UI usable in dev
        this.roles = [
          // { id: 1, rol: 'Administrador', descripcion: 'Acceso total', aplicacion: 'Gestión Usuarios', siglasAplic: 'GESTUSU' },
          // { id: 2, rol: 'Operador', descripcion: 'Acceso limitado', aplicacion: 'Inventario', siglasAplic: 'INVENT' },
        ];
        this.filtrarRoles();
        this.filtrarMenu();
      }
    });
  }

  // Tabla principal
  filtrarRoles(): void {
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.trim().toLowerCase();
      this.rolesFiltrados = this.roles.filter(r =>
        r.rol.toLowerCase().includes(term) ||
        r.descripcion.toLowerCase().includes(term) ||
        r.aplicacion.toLowerCase().includes(term) ||
        r.siglasAplic.toLowerCase().includes(term)
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
    this.loading = true;
    // 1. Consultar todos los menús
    this.menuService.OpcionesMenu().subscribe({
      next: (resp: any[]) => {
        // Filtrar menús por la siglasAplicacion correspondiente a la aplicación del rol
        let menusFiltrados = resp;
        let sigla = rol.siglasAplic ? rol.siglasAplic.toLowerCase() : '';
        if (sigla) {
          menusFiltrados = resp.filter(m => (m.siglasAplicacion && m.siglasAplicacion.toLowerCase() === sigla));
        }
        // 2. Consultar los menús asociados al rol
        this.rolesService.buscarMenuPorRol({ mscRoleId: rol.id }).subscribe({
          next: (menuResp: any) => {
            const seleccionados: number[] = Array.isArray(menuResp?.data) ? menuResp.data : [];
            // Mapea la respuesta a la estructura MenuOption (jerárquica)
            const buildTree = (items: any[]): MenuOption[] => {
              const byId = new Map<number, MenuOption>();
              for (const it of items) {
                byId.set(it.id, {
                  id: it.id,
                  nombreMenu: it.nombre ?? it.nombreMenu ?? '',
                  url: it.ruta ?? it.url ?? '',
                  orden: Number(it.orden ?? 0),
                  aplicaciones: it.siglasAplicacion ?? it.aplicaciones ?? '',
                  checked: seleccionados.includes(it.id),
                  hijos: [],
                  expanded: false
                });
              }
              const roots: MenuOption[] = [];
              for (const node of Array.from(byId.values())) {
                const pid = items.find((i: any) => i.id === node.id)?.idPadre;
                if (pid === null || pid === undefined || pid === 0) {
                  if (node.hijos && node.hijos.length === 0) delete node.hijos;
                  roots.push(node);
                } else {
                  const parent = byId.get(pid);
                  if (parent) {
                    parent.hijos = parent.hijos || [];
                    parent.hijos.push(node);
                  } else {
                    roots.push(node);
                  }
                }
              }
              return roots;
            };
            this.menuOptions = buildTree(menusFiltrados);
            this.filtrarMenu();
            this.loading = false;
          },
          error: () => {
            this.loading = false;
            Swal.fire({ title: 'Error', text: 'No se pudieron cargar los menús asociados.', icon: 'error' });
            // Si falla la consulta de menús asociados, mostrar todos sin selección
            const buildTree = (items: any[]): MenuOption[] => {
              const byId = new Map<number, MenuOption>();
              for (const it of items) {
                byId.set(it.id, {
                  id: it.id,
                  nombreMenu: it.nombre ?? it.nombreMenu ?? '',
                  url: it.ruta ?? it.url ?? '',
                  orden: Number(it.orden ?? 0),
                  aplicaciones: it.siglasAplicacion ?? it.aplicaciones ?? '',
                  checked: false,
                  hijos: [],
                  expanded: false
                });
              }
              const roots: MenuOption[] = [];
              for (const node of Array.from(byId.values())) {
                const pid = items.find((i: any) => i.id === node.id)?.idPadre;
                if (pid === null || pid === undefined || pid === 0) {
                  if (node.hijos && node.hijos.length === 0) delete node.hijos;
                  roots.push(node);
                } else {
                  const parent = byId.get(pid);
                  if (parent) {
                    parent.hijos = parent.hijos || [];
                    parent.hijos.push(node);
                  } else {
                    roots.push(node);
                  }
                }
              }
              return roots;
            };
            this.menuOptions = buildTree(menusFiltrados);
            this.filtrarMenu();
            this.loading = false;
          }
        });
      },
      error: () => {
        this.menuOptions = [];
        this.filtrarMenu();
        this.loading = false;
        Swal.fire({ title: 'Error', text: 'No se pudieron cargar las opciones de menú.', icon: 'error' });
      }
    });
  }

  cancelarAsociacion(): void {
    this.asociando = false;
    this.rolSeleccionado = null;
  }

  guardarAsociacion(): void {
    // Obtiene todos los ids de menú seleccionados (checked)
    const getCheckedIds = (items: MenuOption[]): number[] => {
      let ids: number[] = [];
      for (const item of items) {
        if (item.checked) ids.push(item.id);
        if (item.hijos && item.hijos.length) {
          ids = ids.concat(getCheckedIds(item.hijos));
        }
      }
      return ids;
    };
    const idMenus = getCheckedIds(this.menuOptions);
    const idRole = this.rolSeleccionado?.id;
    if (!idRole) return;
    const payload = { idRole, idMenus };
    this.rolesService.rolesmenu(payload).subscribe({
      next: (resp) => {
        console.log('Sincronización exitosa:', resp);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Asociación realizada con éxito',
          showConfirmButton: false,
          timer: 2500
        });
      },
      error: (err) => {
        console.error('Error al sincronizar:', err);
      }
    });
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