import { Component, OnInit, TemplateRef } from '@angular/core';
import Swal from 'sweetalert2';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AplicacionesService, Aplicacion } from 'src/app/services/aplicaciones-services/aplicaciones.service';
import { MenuService } from 'src/app/services/menu/menu.service';

export interface OpcionMenu {
  // backend-shaped fields
  nombre: string;
  ruta: string;
  idAplicacion: number | null;
  orden: number;
  siglasAplicacion: string;
  idPadre: number | null;

  // local/UI-only fields
  id?: number; // backend primary id
  hijos?: OpcionMenu[];
  checked?: boolean; // used by the form
  _expandido?: boolean; // UI toggle
}

@Component({
  selector: 'app-opciones-de-menu',
  templateUrl: './opciones-de-menu.component.html',
  styleUrls: ['./opciones-de-menu.component.scss']
})
export class OpcionesDeMenuComponent implements OnInit {

  opciones: OpcionMenu[] = [
    // {
    //   nombreMenu: 'Usuarios',
    //   url: '/usuarios',
    //   orden: 10,
    //   aplicaciones: 'Gestión Usuarios',
    //   checked: true,
    //   hijos: [
    //     {
    //       nombreMenu: 'Submenú 1',
    //       url: '/usuarios/sub1',
    //       orden: 1,
    //       aplicaciones: 'Gestión Usuarios',
    //       checked: true
    //     }
    //   ]
    // },
    // {
    //   nombreMenu: 'Inventario',
    //   url: '/inventario',
    //   orden: 20,
    //   aplicaciones: 'Control Inventario',
    //   checked: false
    // }
    // // Puedes agregar más datos de prueba aquí
  ];

  // Paginación y búsqueda
  page: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;
  opcionesFiltradas: OpcionMenu[] = [];
  opcionesPaginadas: OpcionMenu[] = [];
  searchTerm: string = '';

  // Ordenamiento
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';


  modalModo: 'agregar' | 'editar' = 'agregar';
  opcionSeleccionada: OpcionMenu = { nombre: '', ruta: '', idAplicacion: null, orden: 1, siglasAplicacion: '', idPadre: null, checked: true };

  aplicaciones: Aplicacion[] = [];

  constructor(
    private modalService: NgbModal,
    private aplicacionesService: AplicacionesService
    , private menuService: MenuService
  ) { }

  ngOnInit(): void {
    // subscribe to aplicaciones observable so we receive backend-loaded apps
    this.aplicacionesService.getAplicaciones$().subscribe(apps => {
      this.aplicaciones = apps || [];
    });
    // trigger backend load (non-blocking)
    this.aplicacionesService.loadAplicaciones().subscribe({ next: () => {}, error: () => {} });
    // load menu from backend
    this.reloadMenu();
  }

  private reloadMenu(): void {
    this.menuService.OpcionesMenu().subscribe({
      next: (resp: any[]) => {
        const flat: any[] = Array.isArray(resp) ? resp : [];
        if (flat && flat.length) {
          const mapped = flat.map(i => ({
            // map backend -> internal
            nombre: i.nombre ?? i.nombreMenu ?? '',
            ruta: i.ruta ?? i.url ?? '',
            orden: Number(i.orden ?? 0),
            siglasAplicacion: i.siglasAplicacion ?? i.aplicaciones ?? '',
            // preserve backend id fields so we can use them when creating submenus
            id: i.id,
            idPadre: i.idPadre ?? null,
            idAplicacion: i.idAplicacion ?? i.idApplication ?? i.idApp ?? null
          }));

          const tree = this.buildTreeFromFlat(mapped as any[]);
          this.opciones = tree;
          this.filtrarOpciones();
          return;
        }
        this.filtrarOpciones();
      },
      error: (err) => {
        console.error('Error cargando opciones de menú', err);
        this.filtrarOpciones();
      }
    });
  }

  // Convert a flat array with _id and _idPadre into a tree of OpcionMenu
  private buildTreeFromFlat(items: any[]): OpcionMenu[] {
    const byId = new Map<any, any>();
    // first create nodes without hijos
    for (const it of items) {
      byId.set(it.id, {
        nombre: it.nombre || '',
        ruta: it.ruta || '',
        orden: Number(it.orden || 0),
        siglasAplicacion: it.siglasAplicacion || '',
        checked: true,
        hijos: [] as OpcionMenu[],
        id: it.id,
        idPadre: it.idPadre,
        idAplicacion: it.idAplicacion ?? null
      });
    }

    const roots: OpcionMenu[] = [];
    for (const node of Array.from(byId.values())) {
  const pid = node.idPadre;
  if (pid === null || pid === undefined || pid === 0) {
        // top-level
        // keep id property for action usage
        // if no hijos, remove empty array to match previous behaviour
        if (node.hijos && node.hijos.length === 0) delete node.hijos;
        roots.push(node);
      } else {
        const parent = byId.get(pid);
        if (parent) {
          parent.hijos = parent.hijos || [];
          // push child (strip internal ids later)
          const child = { ...node };
          // ensure child keeps its id for later operations
          // (we do not delete child.id)
          parent.hijos.push(child);
        } else {
          // parent not found -> treat as root
          // keep id
          roots.push(node);
        }
      }
    }

    // sort children by orden
    const sortRec = (list: OpcionMenu[]) => {
      list.sort((a, b) => (Number(a.orden || 0) - Number(b.orden || 0)));
      for (const l of list) {
        if (l.hijos) sortRec(l.hijos);
      }
    };
    sortRec(roots);
    return roots;
  }

  // Filtra y ordena recursivamente padres e hijos
  filtrarOpciones(): void {
    const term = this.searchTerm.trim().toLowerCase();
    // Filtrar recursivo
    const filterRecursive = (opciones: OpcionMenu[]): OpcionMenu[] => {
      const resultado: OpcionMenu[] = [];
      for (const op of opciones) {
        let hijosFiltrados = op.hijos ? filterRecursive(op.hijos) : undefined;
        const appStr = op.siglasAplicacion == null ? '' : String(op.siglasAplicacion);
        const match =
          (op.nombre || '').toLowerCase().includes(term) ||
          (op.ruta || '').toLowerCase().includes(term) ||
          appStr.toLowerCase().includes(term);
        if (term === '' || match || (hijosFiltrados && hijosFiltrados.length)) {
          const copia: OpcionMenu = { ...op };
          if (hijosFiltrados && hijosFiltrados.length) {
            copia.hijos = hijosFiltrados;
          } else {
            delete copia.hijos;
          }
          resultado.push(copia);
        }
      }
      return resultado;
    };

    // Ordenar recursivo
    const sortRecursive = (opciones: OpcionMenu[]): OpcionMenu[] => {
      if (!this.sortColumn) return opciones.map(op => ({
        ...op,
        hijos: op.hijos ? sortRecursive(op.hijos) : undefined
      }));
      const col = this.sortColumn as keyof OpcionMenu;
      const sorted = [...opciones].sort((a, b) => {
        let valA = a[col];
        let valB = b[col];
        // Convertir a string para comparar correctamente
        valA = valA === undefined || valA === null ? '' : valA.toString().toLowerCase();
        valB = valB === undefined || valB === null ? '' : valB.toString().toLowerCase();
        if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
      return sorted.map(op => ({
        ...op,
        hijos: op.hijos ? sortRecursive(op.hijos) : undefined
      }));
    };

    let resultado = filterRecursive(this.opciones);
    resultado = sortRecursive(resultado);
  this.opcionesFiltradas = resultado;
    // Para la tabla tipo árbol, no se pagina, se muestra todo el árbol filtrado y ordenado
    // Si quieres paginar, deberías aplanar el árbol, pero para jerarquía visual es mejor mostrar todo
    // this.page = 1;
    // this.actualizarPaginacion();
  }

  // Para tabla tipo árbol, no se pagina, se muestra todo el árbol filtrado y ordenado
  actualizarPaginacion(): void {
    this.totalPages = 1;
    this.opcionesPaginadas = this.opcionesFiltradas;
  }

  ordenarPor(col: string): void {
    if (this.sortColumn === col) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = col;
      this.sortDirection = 'asc';
    }
    this.filtrarOpciones();
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
    console.log('Salir del menú de opciones de menú');
  }

  public parentForSubmenu: OpcionMenu | null = null;

  openAddOpcionModal(content: TemplateRef<any>, parent?: OpcionMenu): void {
    this.modalModo = 'agregar';
    this.parentForSubmenu = parent || null;
    let preselectedAppId: number | null = null;
    if (parent) {
      // Si el padre tiene idAplicacion, úsalo; si no, busca por siglasAplicacion
      if (parent.idAplicacion != null) {
        preselectedAppId = Number(parent.idAplicacion);
      } else if (parent.siglasAplicacion) {
        const found = this.aplicaciones.find(app => app.siglasApplic === parent.siglasAplicacion);
        preselectedAppId = found ? Number(found.idApplication) : null;
      }
    }
    this.opcionSeleccionada = {
      nombre: '',
      ruta: '',
      idAplicacion: preselectedAppId,
      orden: 1,
      siglasAplicacion: '',
  idPadre: parent && typeof parent.id === 'number' ? parent.id : null,
      checked: true
    };
    this.modalService.open(content, { centered: true });
  }

  private parentForEdit: OpcionMenu | null = null;
  private indexForEdit: number | null = null;

  openEditOpcionModal(content: TemplateRef<any>, opcion: OpcionMenu, parent?: OpcionMenu, index?: number): void {
    this.modalModo = 'editar';
    // Asegura que la lista de aplicaciones esté cargada antes de abrir el modal
    if (!this.aplicaciones || this.aplicaciones.length === 0) {
      this.aplicacionesService.loadAplicaciones().subscribe({
        next: () => this._openEditOpcionModal(content, opcion, parent, index),
        error: () => this._openEditOpcionModal(content, opcion, parent, index)
      });
    } else {
      this._openEditOpcionModal(content, opcion, parent, index);
    }
  }

  private _openEditOpcionModal(content: TemplateRef<any>, opcion: OpcionMenu, parent?: OpcionMenu, index?: number): void {
    let selectedId: number | null = null;
    if (opcion.idAplicacion != null) {
      selectedId = Number(opcion.idAplicacion);
    } else if (opcion.siglasAplicacion) {
      // Buscar el id en la lista de aplicaciones por siglas
      const found = this.aplicaciones.find(app => app.siglasApplic === opcion.siglasAplicacion);
      selectedId = found ? Number(found.idApplication) : null;
    }
    console.log('[EDIT MODAL] opcion:', opcion);
    console.log('[EDIT MODAL] aplicaciones:', this.aplicaciones);
    console.log('[EDIT MODAL] selected idAplicacion:', selectedId);
    this.opcionSeleccionada = {
      ...opcion,
      idAplicacion: selectedId
    };
    this.parentForEdit = parent || null;
    this.indexForEdit = typeof index === 'number' ? index : null;
    this.modalService.open(content, { centered: true });
  }

  saveOpcion(modal: any): void {
    if (this.modalModo === 'agregar') {
      // Ensure an application is selected. If adding a submenu and the parent has an appId,
      // prefer that. Do not silently fallback to the first application.
      const selectedApp = this.opcionSeleccionada.idAplicacion;
      let idAplicacion: number | null = null;
      if (selectedApp == null) {
        // if parent exists, try to use its appId
        if (this.parentForSubmenu && (this.parentForSubmenu as any).idAplicacion != null) {
          idAplicacion = Number((this.parentForSubmenu as any).idAplicacion);
        } else {
          Swal.fire({ title: 'Seleccione una aplicación', text: 'Debe seleccionar el sistema al que pertenece la opción.', icon: 'warning' });
          return;
        }
      } else {
        idAplicacion = Number(selectedApp);
      }

      // Build payload matching backend DTO
      const payload: any = {
        nombre: this.opcionSeleccionada.nombre,
        ruta: this.opcionSeleccionada.ruta,
        idAplicacion: idAplicacion,
        orden: Number(this.opcionSeleccionada.orden) || 1,
        habilitado: this.opcionSeleccionada.checked ? 1 : 0,
        parentId: this.parentForSubmenu && (this.parentForSubmenu as any).id ? (this.parentForSubmenu as any).id : null
      };

      // call backend create
      this.menuService.crearMenu(payload).subscribe({
        next: (created: any) => {
          this.showCreateSuccess(created);
          // reload menu from backend
          this.reloadMenu();
          modal.close();
        },
        error: (err) => {
          console.error('Error creando opción de menú', err);
          Swal.fire({ title: 'Error', text: 'No se pudo crear la opción de menú.', icon: 'error' });
        }
      });
    } else if (this.modalModo === 'editar') {
      // Build payload for backend
      const payload: any = {
        id: this.opcionSeleccionada.id,
        nombre: this.opcionSeleccionada.nombre,
        ruta: this.opcionSeleccionada.ruta,
        orden: Number(this.opcionSeleccionada.orden) || 1,
        habilitado: this.opcionSeleccionada.checked ? 1 : 0
      };
      this.menuService.editarMenu(payload).subscribe({
        next: (edited: any) => {
          this.showEditSuccess(edited);
          this.reloadMenu();
          modal.close();
        },
        error: (err) => {
          console.error('Error editando opción de menú', err);
          Swal.fire({ title: 'Error', text: 'No se pudo editar la opción de menú.', icon: 'error' });
        }
      });
    }
    this.parentForSubmenu = null;
    this.parentForEdit = null;
    this.indexForEdit = null;
    this.filtrarOpciones();
  }

  private showEditSuccess(edited: any) {
    Swal.fire({
      title: 'Editado',
      text: `Opción editada: ${edited?.nombre ?? edited?.nombreMenu ?? 'OK'}`,
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    });
  }

  private showCreateSuccess(created: any) {
    Swal.fire({
      title: 'Creado',
      text: `Opción creada: ${created?.nombre ?? created?.nombreMenu ?? 'OK'}`,
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    });
  }

  deleteOpcion(opcion: OpcionMenu, parent?: OpcionMenu, index?: number): void {
    Swal.fire({
  title: `¿Desea eliminar la opción de menú "${opcion.nombre}"?`,
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        if (parent && typeof index === 'number' && parent.hijos) {
          parent.hijos.splice(index, 1);
        } else {
          this.opciones = this.opciones.filter(o => o !== opcion);
        }
        this.filtrarOpciones();
          // Detecta el mensaje específico del backend
          this.menuService.eliminarMenu(opcion.id!).subscribe({
            next: () => {
              this.reloadMenu();
              Swal.fire({
                title: 'Eliminado',
                text: `La opción de menú \"${opcion.nombre}\" ha sido eliminada.`,
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
              });
            },
            error: (err) => {
              console.error('Error eliminando opción de menú', err);
              const msg = err?.message || err?.error?.message || '';
              if (msg.includes('No se puede eliminar un menú que tiene submenús')) {
                Swal.fire({
                  title: 'No permitido',
                  text: 'No se puede eliminar un menú que contenga submenús.',
                  icon: 'warning',
                  showConfirmButton: true
                });
              } else {
                Swal.fire({ title: 'Error', text: 'No se pudo eliminar la opción de menú.', icon: 'error' });
              }
            }
          });
      }
    });
  }
}