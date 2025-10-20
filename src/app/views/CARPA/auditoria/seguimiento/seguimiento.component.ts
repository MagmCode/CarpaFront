import { Component, OnInit, TemplateRef } from '@angular/core';
import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

type SortDir = 'asc' | 'desc' | null;

@Component({
  selector: 'app-seguimiento',
  templateUrl: './seguimiento.component.html',
  styleUrls: ['./seguimiento.component.scss']
})
export class SeguimientoComponent implements OnInit {

  constructor(private modalService: NgbModal) { }

  // aplicaciones (simuladas) para selector
  aplicaciones = [
    { id: 'app1', nombre: 'Aplicación A' },
    { id: 'app2', nombre: 'Aplicación B' },
    { id: 'app3', nombre: 'Aplicación C' }
  ];

  // ejemplo de logs del sistema
  logs: any[] = [
    { id: 1, timestamp: '2025-10-14 10:12:05', source: 'AuthService', message: 'Inicio de sesión iniciado', status: 'in-progress', details: 'Procesando autenticación del usuario...', aplicacion: 'app1' },
    { id: 2, timestamp: '2025-10-14 09:45:12', source: 'ReportService', message: 'Generación de reporte mensual', status: 'completed', details: 'Reporte generado correctamente y almacenado en /reports/monthly.', aplicacion: 'app2' },
    { id: 3, timestamp: '2025-10-13 18:23:48', source: 'SyncJob', message: 'Sincronización de productos', status: 'error', details: 'Timeout al comunicarse con /api/productos. Código: ETIMEDOUT', aplicacion: 'app1' }
  ];

  // selección y modal
  selectedLog: any = null;

  // --- filtro view ---
  viewFiltro: boolean = true; // true -> mostrar formulario de filtro; false -> mostrar tabla de resultados
  filtro = {
    aplicacion: null as string | null,
    fecha: null as NgbDateStruct | null
  };

  // búsqueda y paginación para la vista de resultados
  searchTerm: string = '';
  page: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;
  logsFiltrados: any[] = [];
  logsPaginados: any[] = [];
  // copia inmutable del resultado de la consulta (para restaurar cuando se borra la búsqueda)
  logsQueryResult: any[] = [];

  // ordenamiento
  sortField: string | null = 'timestamp';
  sortDir: SortDir = 'desc';

  ngOnInit(): void {
    // inicialmente no mostrar resultados
  }

  openViewModal(content: TemplateRef<any>, log: any) {
    this.selectedLog = { ...log };
    this.modalService.open(content, { centered: true, size: 'lg' });
  }

  // Ejecutar consulta (aplica filtros y muestra tabla)
  consultar() {
    // filtrar por aplicacion
    let res = [...this.logs];
    if (this.filtro.aplicacion) {
      res = res.filter(l => l.aplicacion === this.filtro.aplicacion);
    }
    // filtrar por fecha única si está definida (convertir NgbDateStruct a Date)
    if (!this.filtro.fecha) {
      Swal.fire('Atención', 'Seleccione una fecha para consultar (máximo 7 días atrás).', 'warning');
      return;
    }

    const sel = this.filtro.fecha;
    const selectedDate = new Date(sel.year, sel.month - 1, sel.day);
    // normalizar horas
    const startOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 23, 59, 59, 999);

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const minAllowed = new Date(todayStart);
    minAllowed.setDate(minAllowed.getDate() - 7); // 7 days lookback

    if (startOfDay < minAllowed) {
      Swal.fire('Atención', 'La fecha no puede ser anterior a 7 días atrás.', 'warning');
      return;
    }
    if (startOfDay > todayStart) {
      Swal.fire('Atención', 'No se puede consultar una fecha futura.', 'warning');
      return;
    }

    res = res.filter(l => {
      const ts = new Date(l.timestamp);
      return ts >= startOfDay && ts <= endOfDay;
    });

    // guardar copia de la consulta para búsquedas no destructivas
    this.logsQueryResult = [...res];
    this.logsFiltrados = [...this.logsQueryResult];
    this.page = 1;
    this.applySort();
    this.actualizarPaginacion();
    this.viewFiltro = false;
  }

  regresarAFiltro() {
    this.viewFiltro = true;
  }

  // export CSV
  exportCsv() {
    if (!this.logsFiltrados) return;
    const rows: string[] = [];
    rows.push(['Fecha','Origen','Mensaje','Estado','Aplicación'].join(','));
    this.logsFiltrados.forEach((r: any) => rows.push([r.timestamp, r.source, this.escapeCsv(r.message), r.status, r.aplicacion].map(this.escapeCsv).join(',')));
    const csv = rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = `seguimiento_${this.filtro.aplicacion || 'all'}.csv`;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  private escapeCsv(val: any) {
    if (val === null || val === undefined) return '""';
    const s = String(val);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }

  // ---- Búsqueda, orden y paginación ----
  filtrarBusqueda(): void {
    const term = this.searchTerm ? this.searchTerm.trim().toLowerCase() : '';
    if (term) {
      this.logsFiltrados = this.logsQueryResult.filter(l =>
        (l.source || '').toLowerCase().includes(term) ||
        (l.message || '').toLowerCase().includes(term) ||
        (l.timestamp || '').toLowerCase().includes(term)
      );
    } else {
      // restaurar al resultado original de la última consulta
      this.logsFiltrados = [...this.logsQueryResult];
    }
    this.page = 1;
    this.applySort();
    this.actualizarPaginacion();
  }

  aplicarBusquedaComoUsuario() {
    // helper si necesitas reiniciar la consulta antes de filtrar en el cliente
    // ahora cada búsqueda opera sobre logsFiltrados que provienen de la consulta
    this.page = 1;
    this.actualizarPaginacion();
  }

  applySort() {
    if (!this.sortField) return;
    const f = this.sortField;
    const dir = this.sortDir === 'asc' ? 1 : -1;
    this.logsFiltrados.sort((a, b) => {
      const va = (a[f] || '').toString().toLowerCase();
      const vb = (b[f] || '').toString().toLowerCase();
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
  }

  toggleSort(field: string) {
    if (this.sortField === field) {
      if (this.sortDir === 'asc') this.sortDir = 'desc';
      else if (this.sortDir === 'desc') this.sortDir = null;
      else this.sortDir = 'asc';
    } else {
      this.sortField = field;
      this.sortDir = 'asc';
    }
    this.applySort();
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
