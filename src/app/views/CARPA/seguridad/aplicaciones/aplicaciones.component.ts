import { Component, OnInit, TemplateRef } from '@angular/core';
import Swal from 'sweetalert2';
import { DataTable } from "simple-datatables";
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AplicacionesService, Aplicacion } from 'src/app/services/aplicaciones-services/aplicaciones.service';
import { ValidarService } from 'src/app/services/validar.service';
import { JwtService } from 'src/app/services/jwt.service';



@Component({
  selector: 'app-aplicaciones',
  templateUrl: './aplicaciones.component.html',
  styleUrls: ['./aplicaciones.component.scss']
})
export class AplicacionesComponent implements OnInit {

  loading = false;

  aplicaciones: Aplicacion[] = [];



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
  // idApplication is numeric per backend DTO; initialize with 0 for new records
  appSeleccionada: Aplicacion = { idApplication: 0, description: '', siglasApplic: '', comentarios: '' } as Aplicacion;

  constructor(
    private modalService: NgbModal,
    private aplicacionesService: AplicacionesService
    , private validarService: ValidarService
    , private jwtService: JwtService
  ) { }

  /**
   * Validate a privilege URL on the server and execute the provided callback only when allowed.
   * Shows a Swal message if the server responds allowed: false or on error.
   */
    private validateAndExecute(privUrl: string, onAllowed: () => void) {
      try {
        this.validarService.validate(privUrl).subscribe({
          next: (resp) => {
            if (resp && resp.allowed === true) {
             
            }
            // allowed
            onAllowed();
          },
          error: (err) => {
            if (err.status === 500) {
              Swal.fire({
                title: 'Error al consultar',
                text: 'No se pudo validar el privilegio, inténtelo más tarde.',
                icon: 'error',
              });
              return;
            } else {
              
            console.error('Error validando privilegio', err);
            Swal.fire({
                title: 'Acceso denegado',
                text: 'No tiene ese privilegio asociado a su rol actual.',
                icon: 'warning',
              });
              return;
            }
          }
        });
      } catch (e) {
        console.error('validateAndExecute exception', e);
        Swal.fire({ title: 'Error', text: 'Error al validar privilegio', icon: 'error' });
      }
    }

  ngOnInit(): void {
    
    // NOTE: temporalmente comentamos la suscripción al servicio backend
    // para permitir trabajo offline / datos ficticios.
    // subscribe to apps coming from the service
    this.aplicacionesService.getAplicaciones$().subscribe(apps => {
      
      this.aplicaciones = apps || [];
      this.filtrarAplicaciones();
    });
    this.loading = true;
    // trigger load from backend (non-blocking)
    this.aplicacionesService.loadAplicaciones().subscribe({ next: () => {
      this.loading = false;
    }, error: () => {
       Swal.fire({ title: 'Error', text: 'No se pudieron cargar los sistemas.', icon: 'error' });
      this.loading = false;
    } });

    // Si el arreglo está vacío, llenar con datos ficticios (no modifica la lógica de filtrado)
    // if (!this.aplicaciones || this.aplicaciones.length === 0) {
    //   this.aplicaciones = [
    //     { idApplication: 101, description: 'Sistema de Ventas', siglasApplic: 'VEN', comentarios: 'Aplicación principal de ventas' },
    //     { idApplication: 102, description: 'Portal Clientes', siglasApplic: 'CLI', comentarios: 'Acceso de clientes externos' },
    //     { idApplication: 103, description: 'API Interna', siglasApplic: 'API', comentarios: 'Servicios internos y microservicios' },
    //     { idApplication: 104, description: 'Admin Backoffice', siglasApplic: 'ADM', comentarios: 'Administración y configuración' },
    //     { idApplication: 105, description: 'Reporting', siglasApplic: 'REP', comentarios: 'Generación de informes' }
    //   ];
    //   this.filtrarAplicaciones();
    // }
    // Subscribe to privileges from JwtService (normalize to leading /)
    try {
      this.jwtService.privileges$?.subscribe((list: string[] | null) => {
        // build set
        this._privileges.clear();
        try {
          (list || []).forEach((u: string) => {
            if (!u) return;
            const normalized = u.startsWith('/') ? u : '/' + u;
            this._privileges.add(normalized);
          });
        } catch (e) {
          // ignore
        }
      });
    } catch (e) {
      // ignore if JwtService not available
    }
  }

  private _privileges: Set<string> = new Set<string>();

  hasPrivilege(url: string): boolean {
    if (!url) return false;
    const normalized = url.startsWith('/') ? url : '/' + url;
    return this._privileges.has(normalized);
  }
  ngAfterViewInit(): void {
    // Inicializa DataTable después de que la vista esté lista (opcional, si usas simple-datatables)
    // const dataTable = new DataTable("#aplicacionesTable");
  }


  filtrarAplicaciones(): void {
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.trim().toLowerCase();
      this.aplicacionesFiltradas = this.aplicaciones.filter(app =>
        app.description.toLowerCase().includes(term) ||
        app.siglasApplic.toLowerCase().includes(term) ||
        (app.comentarios || '').toLowerCase().includes(term)
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
    this.validateAndExecute('/add_system', () => {
      this.modalModo = 'agregar';
      this.appSeleccionada = { idApplication: 0, description: '', siglasApplic: '', comentarios: '' };
      this.modalService.open(content, { centered: true });
    });
  }

  openEditApplicationModal(content: TemplateRef<any>, app: Aplicacion): void {
    this.validateAndExecute('/edit_system', () => {
      this.modalModo = 'editar';
      this.appSeleccionada = { ...app };
      this.modalService.open(content, { centered: true });
    });
  }
  saveApplication(modal: any): void {
    const performSave = () => {
      // Validaciones de campos obligatorios
      const { description, siglasApplic, comentarios } = this.appSeleccionada;
      if (!description || !description.trim() || !siglasApplic || !siglasApplic.trim() || !comentarios || !comentarios.trim()) {
        Swal.fire({
          toast: true,
          position: 'top-start',
          icon: 'warning',
          title: 'Campos obligatorios',
          text: 'Debes completar todos los campos antes de guardar.',
          showConfirmButton: false,
          timer: 3500,
          timerProgressBar: true
        });
        return;
      }

      if (this.modalModo === 'agregar') {
        this.loading = true;
        this.aplicacionesService.createAplicacion(this.appSeleccionada).subscribe({
          next: (created) => {
            this.aplicaciones = this.aplicacionesService.getAplicaciones();
            this.filtrarAplicaciones();
            this.loading = false;
            Swal.fire({
              toast: true,
              position: 'top-start',
              icon: 'success',
              title: 'Sistema creado',
              text: `${created.description}`,
              showConfirmButton: false,
              timer: 3000,
              timerProgressBar: true
            });
            modal.close();
          },
          error: (err) => {
            this.loading = false;
            console.error('Error creating aplicacion', err);
            if (err && err.errorCode == 'APLICACION_DUPLICADA') {
               Swal.fire({
              // toast: true,
              position: 'center',
              icon: 'warning',
              title: 'Sistema duplicado',
              text: 'Ya existe una sistema con las mismas siglas.',
              showConfirmButton: false,
              timer: 2000,
              // timerProgressBar: true
            });
            } else {
            Swal.fire({
              // toast: true,
              position: 'center',
              icon: 'error',
              title: 'Error al crear',
              text: (err && err.message) ? err.message : JSON.stringify(err),
              showConfirmButton: false,
              timer: 2000,
              // timerProgressBar: true
            });
          }
        }
        });
      } else if (this.modalModo === 'editar') {
        this.loading = true;
        this.aplicacionesService.updateAplicacion(this.appSeleccionada).subscribe({
          next: (updated) => {
            const idx = this.aplicaciones.findIndex(a => String(a.idApplication) === String(updated.idApplication));
            if (idx > -1) {
              this.aplicaciones[idx] = updated;
            } else {
              this.aplicaciones.unshift(updated);
            }
            this.loading = false;
            this.filtrarAplicaciones();
            Swal.fire({
              toast: true,
              position: 'top-start',
              icon: 'success',
              title: 'Sistema actualizado',
              text: `${updated.description}`,
              showConfirmButton: false,
              timer: 3000,
              timerProgressBar: true
            });
            modal.close();
          },
          error: (err) => {
            console.error('Error updating aplicacion', err);
            this.loading = false;
            Swal.fire({
              toast: true,
              position: 'top-start',
              icon: 'error',
              title: 'Error al actualizar',
              text: (err && err.message) ? err.message : JSON.stringify(err),
              showConfirmButton: false,
              timer: 4000,
              timerProgressBar: true
            });
          }
        });
      }
    };

    // Decide privilege path based on modal mode
    const priv = this.modalModo === 'editar' ? '/edit_system' : '/add_system';
    this.validateAndExecute(priv, performSave);
  }

  deleteApplication(app: Aplicacion): void {
    Swal.fire({
      title: `¿Desea eliminar la sistema "${app.description}"?`,
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        // call backend
        this.aplicacionesService.deleteAplicacion(app.idApplication).subscribe({
          next: () => {
            // local cache already updated by service; refresh view
            this.aplicaciones = this.aplicacionesService.getAplicaciones();
            this.filtrarAplicaciones();
            Swal.fire({
              toast: true,
              position: 'top-start',
              icon: 'success',
              title: 'Eliminado',
              text: `el sistema "${app.description}" ha sido eliminado.`,
              showConfirmButton: false,
              timer: 2000
            });
          },
          error: (err) => {
            console.error('Error deleting aplicacion', err);
            Swal.fire({
              toast: true,
              position: 'top-start',
              icon: 'error',
              title: 'Error al eliminar',
              text: (err && err.message) ? err.message : JSON.stringify(err),
              showConfirmButton: false,
              timer: 4000
            });
          }
        });
      }
    });
  }
}