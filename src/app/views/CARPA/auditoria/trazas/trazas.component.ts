import { Component, OnInit, TemplateRef } from '@angular/core';
import Swal from 'sweetalert2';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-trazas',
  templateUrl: './trazas.component.html',
  styleUrls: ['./trazas.component.scss']
})
export class TrazasComponent implements OnInit {

  constructor(private modalService: NgbModal) { }

  // modelo y datos
  trazas: any[] = [
    { url: '/api/usuarios', auditable: true },
    { url: '/api/reportes', auditable: false },
    { url: '/api/productos', auditable: true }
  ];

  // modal y seleccion
  modalMode: 'add' | 'edit' = 'add';
  trazaSeleccionada: any = { url: '', auditable: false };

  // busqueda y paginacion
  searchTerm: string = '';
  page: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;
  trazasFiltradas: any[] = [];
  trazasPaginadas: any[] = [];

  ngOnInit(): void {
    this.filtrarTrazas();
  }

  openAddModal(content: TemplateRef<any>) {
    this.modalMode = 'add';
    this.trazaSeleccionada = { url: '', auditable: false };
    this.modalService.open(content, { centered: true });
  }

  openEditModal(content: TemplateRef<any>, traza: any) {
    this.modalMode = 'edit';
    this.trazaSeleccionada = { ...traza };
    // store reference to original to update later
    this._editingOriginal = traza;
    this.modalService.open(content, { centered: true });
  }

  private _editingOriginal: any = null;

  saveTraza(modal: any) {
    if (this.modalMode === 'add') {
      this.trazas.push({ ...this.trazaSeleccionada });
    } else if (this.modalMode === 'edit' && this._editingOriginal) {
      Object.assign(this._editingOriginal, this.trazaSeleccionada);
      this._editingOriginal = null;
    }
    this.filtrarTrazas();
    modal.close();
  }

  deleteTraza(traza: any) {
    Swal.fire({
      title: `¿Desea eliminar esta traza?`,
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.trazas = this.trazas.filter(t => t !== traza);
        this.filtrarTrazas();
        Swal.fire({
          title: 'Eliminado',
          text: `La traza ha sido eliminada.`,
          icon: 'success',
          timer: 1200,
          showConfirmButton: false
        });
      }
    });
  }

  // ---- Busqueda y paginacion ----
  filtrarTrazas(): void {
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.trim().toLowerCase();
      this.trazasFiltradas = this.trazas.filter(t =>
        (t.url || '').toLowerCase().includes(term)
      );
    } else {
      this.trazasFiltradas = [...this.trazas];
    }
    this.page = 1;
    this.actualizarPaginacion();
  }

  actualizarPaginacion(): void {
    this.totalPages = Math.max(1, Math.ceil(this.trazasFiltradas.length / this.pageSize));
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.trazasPaginadas = this.trazasFiltradas.slice(start, end);
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

}
