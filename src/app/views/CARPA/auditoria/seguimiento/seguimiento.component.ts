import { Component, OnInit, TemplateRef } from '@angular/core';
import { LogsService } from 'src/app/services/auditoria/logs.service';
import { AplicacionesService, Aplicacion } from 'src/app/services/aplicaciones-services/aplicaciones.service';
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
  statusFiltro: string | null = null;
  filtrarPorStatus(): void {
    let res = [...this.logsQueryResult];
    if (this.statusFiltro) {
      res = res.filter(l => l.status === this.statusFiltro);
    }
    // aplicar búsqueda si hay término
    const term = this.searchTerm ? this.searchTerm.trim().toLowerCase() : '';
    if (term) {
      res = res.filter(l =>
        (l.source || '').toLowerCase().includes(term) ||
        (l.message || '').toLowerCase().includes(term) ||
        (l.timestamp || '').toLowerCase().includes(term)
      );
    }
    this.logsFiltrados = res;
    this.page = 1;
    this.applySort();
    this.actualizarPaginacion();
  }

  aplicaciones: Aplicacion[] = [];
  constructor(
    private modalService: NgbModal,
    private logsService: LogsService,
    private aplicacionesService: AplicacionesService
  ) {}
  

  // aplicaciones: se cargan desde el servicio en ngOnInit

  // ejemplo de logs del sistema
  logs: any[] = [];


  // selección y modal
  selectedLog: any = null;

  // --- filtro view ---
  viewFiltro: boolean = true; // true -> mostrar formulario de filtro; false -> mostrar tabla de resultados
  filtro = {
    aplicacion: null as string | null,
    fecha: this.getTodayDateStruct()
  };

  private getTodayDateStruct(): NgbDateStruct {
    const today = new Date();
    return {
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      day: today.getDate()
    };
  }

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
    this.aplicacionesService.loadAplicaciones().subscribe({
      next: (apps) => {
        this.aplicaciones = apps;
      },
      error: () => {
        this.aplicaciones = [];
      }
    });
  }

  openViewModal(content: TemplateRef<any>, log: any) {
    this.selectedLog = { ...log };
    this.modalService.open(content, { centered: true, size: 'lg' });
  }

  // Ejecutar consulta (aplica filtros y muestra tabla)
  consultar() {
    // Validar fecha
    if (!this.filtro.fecha) {
      Swal.fire('Atención', 'Seleccione una fecha para consultar (máximo 7 días atrás).', 'warning');
      return;
    }
    const sel = this.filtro.fecha;
    const selectedDate = new Date(sel.year, sel.month - 1, sel.day);
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const minAllowed = new Date(todayStart);
    minAllowed.setDate(minAllowed.getDate() - 7);
    const startOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 0, 0, 0, 0);
    if (startOfDay < minAllowed) {
      Swal.fire('Atención', 'La fecha no puede ser anterior a 7 días atrás.', 'warning');
      return;
    }
    if (startOfDay > todayStart) {
      Swal.fire('Atención', 'No se puede consultar una fecha futura.', 'warning');
      return;
    }

    // Obtener nombreAplicacion y tipoLog
    let nombreAplicacion = '';
    let tipoLog = '';
    if (this.filtro.aplicacion) {
      const app = this.aplicaciones.find(a => String(a.idApplication) === String(this.filtro.aplicacion) || a.siglasApplic === this.filtro.aplicacion);
      if (app && app.siglasApplic) {
        nombreAplicacion = app.siglasApplic.toLowerCase() + '-service';
        tipoLog = app.siglasApplic.toLowerCase() + '-system';
      } else {
        nombreAplicacion = String(this.filtro.aplicacion).toLowerCase() + '-service';
        tipoLog = String(this.filtro.aplicacion).toLowerCase() + '-system';
      }
    } else {
      // nombreAplicacion = 'carpa-service'; // default if none selected
      // tipoLog = 'carpa-system';
      console.warn('No se seleccionó aplicación; se consultarán logs de todas las aplicaciones.');
    }

    // Formatear fecha a YYYY-MM-DD
    const fechaStr = `${sel.year}-${String(sel.month).padStart(2, '0')}-${String(sel.day).padStart(2, '0')}`;

    this.logsService.obtenerLogs(fechaStr, nombreAplicacion, tipoLog).subscribe({
      next: (resp: any[]) => {
        // Mapear respuesta a formato de cards
        this.logs = (resp || []).map((item, idx) => ({
          id: idx + 1,
          timestamp: fechaStr,
          source: item.file,
          message: item.line,
          status: '',
          details: item.line,
          aplicacion: nombreAplicacion
        }));
        this.logsQueryResult = [...this.logs];
        this.logsFiltrados = [...this.logsQueryResult];
        this.page = 1;
        this.applySort();
        this.actualizarPaginacion();
        this.viewFiltro = false;
      },
      error: (err) => {
        Swal.fire('Error', 'No se pudieron obtener los logs.', 'error');
        this.logs = [];
        this.logsQueryResult = [];
        this.logsFiltrados = [];
      }
    });
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
    this.filtrarPorStatus();
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
