import { Component, OnInit, TemplateRef } from '@angular/core';
import Swal from 'sweetalert2';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AplicacionesService, Aplicacion } from 'src/app/services/aplicaciones-services/aplicaciones.service';

export interface OpcionMenu {
  nombreMenu: string;
  url: string;
  orden: number;
  aplicaciones: string;
  checked: boolean; // Habilitado
  hijos?: OpcionMenu[];
}

@Component({
  selector: 'app-opciones-de-menu',
  templateUrl: './opciones-de-menu.component.html',
  styleUrls: ['./opciones-de-menu.component.scss']
})
export class OpcionesDeMenuComponent implements OnInit {

  opciones: OpcionMenu[] = [
    {
      nombreMenu: 'Usuarios',
      url: '/usuarios',
      orden: 10,
      aplicaciones: 'Gestión Usuarios',
      checked: true,
      hijos: [
        {
          nombreMenu: 'Submenú 1',
          url: '/usuarios/sub1',
          orden: 1,
          aplicaciones: 'Gestión Usuarios',
          checked: true
        }
      ]
    },
    {
      nombreMenu: 'Inventario',
      url: '/inventario',
      orden: 20,
      aplicaciones: 'Control Inventario',
      checked: false
    }
    // Puedes agregar más datos de prueba aquí
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
  opcionSeleccionada: OpcionMenu = { nombreMenu: '', url: '', orden: 1, aplicaciones: '', checked: true };

  aplicaciones: Aplicacion[] = [];

  constructor(
    private modalService: NgbModal,
    private aplicacionesService: AplicacionesService
  ) { }

  ngOnInit(): void {
    this.aplicaciones = this.aplicacionesService.getAplicaciones();
    this.filtrarOpciones();
  }

  // Filtra y ordena recursivamente padres e hijos
  filtrarOpciones(): void {
    const term = this.searchTerm.trim().toLowerCase();
    // Filtrar recursivo
    const filterRecursive = (opciones: OpcionMenu[]): OpcionMenu[] => {
      const resultado: OpcionMenu[] = [];
      for (const op of opciones) {
        let hijosFiltrados = op.hijos ? filterRecursive(op.hijos) : undefined;
        const match =
          op.nombreMenu.toLowerCase().includes(term) ||
          op.url.toLowerCase().includes(term) ||
          op.aplicaciones.toLowerCase().includes(term);
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

  private parentForSubmenu: OpcionMenu | null = null;

  openAddOpcionModal(content: TemplateRef<any>, parent?: OpcionMenu): void {
    this.modalModo = 'agregar';
    this.opcionSeleccionada = { nombreMenu: '', url: '', orden: 1, aplicaciones: '', checked: true };
    this.parentForSubmenu = parent || null;
    this.modalService.open(content, { centered: true });
  }

  private parentForEdit: OpcionMenu | null = null;
  private indexForEdit: number | null = null;

  openEditOpcionModal(content: TemplateRef<any>, opcion: OpcionMenu, parent?: OpcionMenu, index?: number): void {
    this.modalModo = 'editar';
    this.opcionSeleccionada = { ...opcion };
    this.parentForEdit = parent || null;
    this.indexForEdit = typeof index === 'number' ? index : null;
    this.modalService.open(content, { centered: true });
  }

  saveOpcion(modal: any): void {
    if (this.modalModo === 'agregar') {
      if (this.parentForSubmenu) {
        if (!this.parentForSubmenu.hijos) this.parentForSubmenu.hijos = [];
        this.parentForSubmenu.hijos.push({ ...this.opcionSeleccionada });
      } else {
        this.opciones.push({ ...this.opcionSeleccionada });
      }
    } else if (this.modalModo === 'editar') {
      if (this.parentForEdit && this.indexForEdit !== null && this.parentForEdit.hijos) {
        this.parentForEdit.hijos[this.indexForEdit] = { ...this.opcionSeleccionada };
      } else {
        const idx = this.opciones.findIndex(o => o === this.opcionesPaginadas.find(op => op === this.opcionSeleccionada));
        if (idx > -1) {
          this.opciones[idx] = { ...this.opcionSeleccionada };
        } else {
          // fallback: buscar por nombreMenu y url
          const idx2 = this.opciones.findIndex(o => o.nombreMenu === this.opcionSeleccionada.nombreMenu && o.url === this.opcionSeleccionada.url);
          if (idx2 > -1) this.opciones[idx2] = { ...this.opcionSeleccionada };
        }
      }
    }
    this.parentForSubmenu = null;
    this.parentForEdit = null;
    this.indexForEdit = null;
    this.filtrarOpciones();
    modal.close();
  }

  deleteOpcion(opcion: OpcionMenu, parent?: OpcionMenu, index?: number): void {
    Swal.fire({
      title: `¿Desea eliminar la opción de menú "${opcion.nombreMenu}"?`,
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
        Swal.fire({
          title: 'Eliminado',
          text: `La opción de menú "${opcion.nombreMenu}" ha sido eliminada.`,
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
  }
}