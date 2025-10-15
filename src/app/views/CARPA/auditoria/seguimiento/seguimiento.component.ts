import { Component, OnInit, TemplateRef } from '@angular/core';
import Swal from 'sweetalert2';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-seguimiento',
  templateUrl: './seguimiento.component.html',
  styleUrls: ['./seguimiento.component.scss']
})
export class SeguimientoComponent implements OnInit {

  constructor(private modalService: NgbModal) { }

  // ejemplo de logs del sistema
  logs: any[] = [
    { id: 1, timestamp: '2025-10-14 10:12:05', source: 'AuthService', message: 'Inicio de sesión iniciado', status: 'in-progress', details: 'Procesando autenticación del usuario...' },
    { id: 2, timestamp: '2025-10-14 09:45:12', source: 'ReportService', message: 'Generación de reporte mensual', status: 'completed', details: 'Reporte generado correctamente y almacenado en /reports/monthly.' },
    { id: 3, timestamp: '2025-10-13 18:23:48', source: 'SyncJob', message: 'Sincronización de productos', status: 'error', details: 'Timeout al comunicarse con /api/productos. Código: ETIMEDOUT' }
  ];

  // selección y modal
  selectedLog: any = null;

  // búsqueda y paginación
  searchTerm: string = '';
  page: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;
  logsFiltrados: any[] = [];
  logsPaginados: any[] = [];

  ngOnInit(): void {
    this.filtrarLogs();
  }

  openViewModal(content: TemplateRef<any>, log: any) {
    this.selectedLog = { ...log };
    this.modalService.open(content, { centered: true, size: 'lg' });
  }

  deleteLog(log: any) {
    Swal.fire({
      title: `¿Desea eliminar este registro de seguimiento?`,
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.logs = this.logs.filter(l => l !== log);
        this.filtrarLogs();
        Swal.fire({
          title: 'Eliminado',
          text: `El registro ha sido eliminado.`,
          icon: 'success',
          timer: 1200,
          showConfirmButton: false
        });
      }
    });
  }

  // ---- Búsqueda y paginación ----
  filtrarLogs(): void {
    if (this.searchTerm && this.searchTerm.trim()) {
      const term = this.searchTerm.trim().toLowerCase();
      this.logsFiltrados = this.logs.filter(l =>
        (l.source || '').toLowerCase().includes(term) ||
        (l.message || '').toLowerCase().includes(term) ||
        (l.timestamp || '').toLowerCase().includes(term)
      );
    } else {
      this.logsFiltrados = [...this.logs];
    }
    this.page = 1;
    this.actualizarPaginacion();
  }

  actualizarPaginacion(): void {
    this.totalPages = Math.max(1, Math.ceil(this.logsFiltrados.length / this.pageSize));
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.logsPaginados = this.logsFiltrados.slice(start, end);
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
