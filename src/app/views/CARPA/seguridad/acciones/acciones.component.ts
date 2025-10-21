
import { Component, OnInit, TemplateRef } from '@angular/core';
import { AplicacionesService, Aplicacion } from 'src/app/services/aplicaciones-services/aplicaciones.service';
import { AccionesService } from 'src/app/services/acciones/acciones.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';

interface Accion {
  idAction: number;
  url: string;
  description: string;
  idApplication: number;
  applicationName: string;
  secured: string;
}

@Component({
  selector: 'app-acciones',
  templateUrl: './acciones.component.html',
  styleUrls: ['./acciones.component.scss']
})
export class AccionesComponent implements OnInit {
  aplicaciones: Aplicacion[] = [];
  loading = false;

  acciones: { url: string; descripcion: string; aplicacion: string }[] = [];
  aplicacionesMap: { [desc: string]: number } = {}; // Para mapear nombre a id

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
  accionSeleccionada: ({ url: string; descripcion: string; aplicacion: string } | Accion) | null = null;

  constructor(
    private aplicacionesService: AplicacionesService,
    private accionesService: AccionesService,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    // Suscribirse al observable para tener la lista siempre actualizada
    this.aplicacionesService.getAplicaciones$().subscribe(apps => {
      this.aplicaciones = apps || [];
      // Mapear nombre a id para el combo
      this.aplicacionesMap = {};
      this.aplicaciones.forEach(app => {
        this.aplicacionesMap[app.description] = app.idApplication;
      });
    });
    // Cargar desde backend (no bloqueante)
    this.aplicacionesService.loadAplicaciones().subscribe({ next: () => {}, error: () => {} });
    this.cargarAcciones();
  }

  cargarAcciones() {
    this.loading = true;
    this.accionesService.buscar({}).subscribe({
      next: (resp: any) => {
        const data = resp && resp.data ? resp.data : resp;
        this.acciones = (Array.isArray(data) ? data : []).map((a: any) => ({
          url: a.url,
          descripcion: a.description,
          aplicacion: a.applicationName
        }));
        this.filtrarAcciones();
        this.loading = false;
      },
      error: (err) => {
        Swal.fire({ title: 'Error', text: 'No se pudieron cargar las acciones.', icon: 'error' });
        this.acciones = [];
        this.filtrarAcciones();
        this.loading = false;
      }
    });
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

  openEditActionModal(content: TemplateRef<any>, accion: any) {
    this.modalModo = 'editar';
    // Buscar la aplicación por nombre o id
    let appId: string = '';
    // Si la acción tiene idApplication, úsalo; si no, busca por nombre
    if (accion.idApplication) {
      appId = String(accion.idApplication);
    } else if (accion.aplicacion) {
      // Buscar en la lista de aplicaciones por nombre
      const found = this.aplicaciones.find(app => app.description === accion.aplicacion || app.siglasApplic === accion.aplicacion);
      if (found) appId = String(found.idApplication);
    }
    this.newAction = {
      url: accion.url,
      descripcion: accion.descripcion,
      aplicacion: appId
    };
    // Guardar el objeto original del backend (con idAction) si existe
    this.accionSeleccionada = (accion.idAction !== undefined) ? accion : this.buscarAccionPorCampos(accion);
    this.modalService.open(content, { centered: true });
  }

  // Busca la acción original en this.accionesService.getAcciones() por url y descripcion
  private buscarAccionPorCampos(accion: any): any {
    const lista = this.accionesService.getAcciones();
    return lista.find(a => a.url === accion.url && a.description === (accion.descripcion || accion.description));
  }

  saveAction(modal: any) {
    if (this.modalModo === 'agregar') {
      let idApplication = Number(this.newAction.aplicacion);
      const payload = {
        url: this.newAction.url,
        description: this.newAction.descripcion,
        idApplication: idApplication,
        secured: 's'
      };
      this.accionesService.crear(payload).subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Acción creada', timer: 1200, showConfirmButton: false });
          this.cargarAcciones();
          modal.close();
        },
        error: (err) => {
          Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo crear la acción.' });
        }
      });
    } else if (this.modalModo === 'editar' && this.accionSeleccionada) {
      // Buscar idApplication
      let idApplication = Number(this.newAction.aplicacion);
      // Type guard para obtener idAction
      let idAction: number | undefined = undefined;
      if ('idAction' in this.accionSeleccionada) {
        idAction = (this.accionSeleccionada as any).idAction;
      }
      if (!idAction) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo determinar el id de la acción a editar.' });
        return;
      }
      const payload = {
        idAction: idAction,
        url: this.newAction.url,
        description: this.newAction.descripcion,
        idApplication: idApplication,
        secured: 's'
      };
      this.accionesService.editar(payload).subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Acción editada', timer: 1200, showConfirmButton: false });
          this.cargarAcciones();
          modal.close();
        },
        error: (err) => {
          Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo editar la acción.' });
        }
      });
    }
  }

  deleteAccion(accion: any): void {
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
        // Buscar el idAction
        let idAction: number | undefined = undefined;
        if ('idAction' in accion) {
          idAction = (accion as any).idAction;
        } else {
          // Buscar en la lista original
          const found = this.accionesService.getAcciones().find(a => a.url === accion.url && a.description === (accion.descripcion || accion.description));
          if (found) idAction = found.idAction;
        }
        if (!idAction) {
          Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo determinar el id de la acción a eliminar.' });
          return;
        }
        this.accionesService.eliminar(idAction).subscribe({
          next: () => {
            Swal.fire({
              title: 'Eliminado',
              text: `La acción ha sido eliminada.`,
              icon: 'success',
              timer: 1500,
              showConfirmButton: false
            });
            this.cargarAcciones();
          },
          error: (err) => {
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo eliminar la acción.' });
          }
        });
      }
    });
  }
  
  // --- Batch file handling state ---
  archivoLoteSeleccionado: File | null = null;
  archivoEliminarSeleccionado: File | null = null;

  // Abrir modal de agregar en lote
  openAgregarEnLote(template: TemplateRef<any>) {
    this.archivoLoteSeleccionado = null;
    this.modalService.open(template, { centered: true });
  }

  // Abrir modal de eliminar en lote
  openEliminarEnLote(template: TemplateRef<any>) {
    this.archivoEliminarSeleccionado = null;
    this.modalService.open(template, { centered: true });
  }

  // Selección de archivo para agregar en lote
  onFileSelected(event: any) {
    const file: File = event.target.files && event.target.files[0];
    if (file) this.archivoLoteSeleccionado = file;
  }

  // Selección de archivo para eliminar en lote
  onFileSelectedToDelete(event: any) {
    const file: File = event.target.files && event.target.files[0];
    if (file) this.archivoEliminarSeleccionado = file;
  }

  // Procesar subida (placeholder)
  procesarAgregarLote(modal: any) {
    if (!this.archivoLoteSeleccionado) {
      Swal.fire({ title: 'Sin archivo', text: 'Seleccione un archivo Excel para procesar.', icon: 'info' });
      return;
    }
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Procesando archivo', text: `Archivo: ${this.archivoLoteSeleccionado.name}`, showConfirmButton: false, timer: 2000 });
    modal.close();
    // TODO: implementar parsing y creación de acciones
  }

  // Procesar eliminación desde archivo (placeholder)
  procesarEliminarDesdeArchivo(modal: any) {
    if (!this.archivoEliminarSeleccionado) {
      Swal.fire({ title: 'Sin archivo', text: 'Seleccione un archivo con URLs para eliminar.', icon: 'info' });
      return;
    }
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Procesando archivo de eliminación', text: `Archivo: ${this.archivoEliminarSeleccionado.name}`, showConfirmButton: false, timer: 2000 });
    modal.close();
    // TODO: implementar lectura del archivo y eliminación por URLs
  }

  // Mostrar confirmación antes de procesar eliminación desde archivo
  confirmarProcesarEliminarArchivo(modal: any) {
    if (!this.archivoEliminarSeleccionado) {
      Swal.fire({ title: 'Sin archivo', text: 'Seleccione un archivo con URLs para eliminar.', icon: 'info' });
      return;
    }
    Swal.fire({
      title: '¿Está seguro? Puede eliminar varias acciones',
      text: `Se eliminarán las acciones indicadas en el archivo: ${this.archivoEliminarSeleccionado.name}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.procesarEliminarDesdeArchivo(modal);
      }
    });
  }
}


