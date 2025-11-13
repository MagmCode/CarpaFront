import { Component, OnInit } from '@angular/core';
import { AplicacionesService, Aplicacion } from 'src/app/services/aplicaciones-services/aplicaciones.service';
import { ReportesService } from 'src/app/services/auditoria/reportes.service';
import Swal from 'sweetalert2';

type ViewMode = 'usuarios' | 'acciones' | 'roles';

@Component({
  selector: 'app-reportes-aplicacion',
  templateUrl: './reportes-aplicacion.component.html',
  styleUrls: ['./reportes-aplicacion.component.scss']
})
export class ReportesAplicacionComponent implements OnInit {

  aplicaciones: Aplicacion[] = [];

  // selected application id (can be number or string depending on backend)
  selectedApp: Aplicacion['idApplication'] | null = null;

  // ensure sample data is seeded only once when aplicaciones load
  private seedDone: boolean = false;

  // vista actual
  view: ViewMode = 'usuarios';

  usuarios: any[] = [];
  acciones: any[] = [];
  roles: any[] = [];
    loading: boolean = false;

  // filtrado y paginación
  searchTerm: string = '';
  page: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;
  itemsFiltrados: any[] = [];
  itemsPaginados: any[] = [];

  constructor(
    private aplicacionesService: AplicacionesService,
    private reportesService: ReportesService
  ) { }

  ngOnInit(): void {
      this.aplicacionesService.getAplicaciones$().subscribe(apps => {
        this.aplicaciones = apps || [];
        // Seleccionar por defecto la app con siglasApplic 'carpa' si existe
        const carpaApp = this.aplicaciones.find(a => a.siglasApplic?.toLowerCase() === 'carpa');
        if (carpaApp) {
          this.selectedApp = carpaApp.idApplication;
          this.onAppSelected();
        }
      });
      this.aplicacionesService.loadAplicaciones().subscribe({ next: () => {}, error: () => {} });
  }

  // helpers para el template: contar por aplicacion (evita arrow functions inline en el template)
  getUsuariosCount(): number {
    return this.usuarios.length;
  }
  getAccionesCount(): number {
    return this.acciones.length;
  }
  getRolesCount(): number {
    return this.roles.length;
  }

  // returns the selected application's display name (or null)
  getSelectedAppName(): string | null {
    if (!this.selectedApp) return null;
    const app = this.aplicaciones.find(a => a.idApplication === this.selectedApp);
    return app ? app.siglasApplic : null;
  }

  // Elimina la generación de datos de ejemplo

  // cuando se selecciona app o cambia vista
  onAppSelected() {
    this.searchTerm = '';
    this.page = 1;
    this.usuarios = [];
    this.acciones = [];
    this.roles = [];
    // obtener siglasApplic de la app seleccionada
    const app = this.aplicaciones.find(a => a.idApplication === this.selectedApp);
    const siglas = app ? app.siglasApplic : null;
    if (siglas) {
      this.loading = true;
      this.reportesService.obtenerReportes(siglas).subscribe({
        next: (resp: any) => {
          this.usuarios = Array.isArray(resp.usuarios) ? resp.usuarios : [];
          this.acciones = Array.isArray(resp.acciones) ? resp.acciones : [];
          this.roles = Array.isArray(resp.roles) ? resp.roles : [];
          this.updateList();
          this.loading = false;
        },
        error: () => {
          this.usuarios = [];
          this.acciones = [];
          this.roles = [];
          this.updateList();
          this.loading = false;
          Swal.fire({ title: 'Error', text: 'No se pudieron cargar los reportes para la aplicación seleccionada.', icon: 'error' });
        }
      });
    } else {
      this.updateList();
    }
  }

  setView(v: ViewMode) {
    this.view = v;
    this.searchTerm = '';
    this.page = 1;
    this.updateList();
  }

  updateList() {
    let source: any[] = [];
    if (this.view === 'usuarios') source = this.usuarios;
    if (this.view === 'acciones') source = this.acciones;
    if (this.view === 'roles') source = this.roles;

    if (this.searchTerm && this.searchTerm.trim()) {
      const term = this.searchTerm.trim().toLowerCase();
      this.itemsFiltrados = source.filter(item => {
        if (this.view === 'usuarios') {
          return (item.userId || '').toLowerCase().includes(term)
            || (item.fullName || '').toLowerCase().includes(term)
            || (item.email || '').toLowerCase().includes(term);
        }
        if (this.view === 'acciones') {
          return (item.url || '').toLowerCase().includes(term)
            || (item.description || '').toLowerCase().includes(term)
            || (item.applicationName || '').toLowerCase().includes(term);
        }
        // roles
        return (item.rol || '').toLowerCase().includes(term)
          || (item.descripcion || '').toLowerCase().includes(term)
          || (item.tipo || '').toLowerCase().includes(term)
          || (item.aplicacion || '').toLowerCase().includes(term);
      });
    } else {
      this.itemsFiltrados = [...source];
    }
    this.actualizarPaginacion();
  }

  actualizarPaginacion() {
    this.totalPages = Math.max(1, Math.ceil(this.itemsFiltrados.length / this.pageSize));
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.itemsPaginados = this.itemsFiltrados.slice(start, end);
  }

  cambiarPagina(nueva: number) {
    if (nueva < 1 || nueva > this.totalPages) return;
    this.page = nueva;
    this.actualizarPaginacion();
  }

  cambiarPageSize(size: number) {
    this.pageSize = size;
    this.page = 1;
    this.actualizarPaginacion();
  }

  // export CSV (Excel puede abrir CSV)
  exportCsv() {
    if (!this.itemsFiltrados) return;
    const rows: string[] = [];
    if (this.view === 'usuarios') {
      rows.push(['Usuario ID','Rol','Nombres','Apellidos','Email','Estatus'].join(','));
      this.itemsFiltrados.forEach((r: any) => rows.push([r.usuarioId, r.rol, r.nombres, r.apellidos, r.email, r.estatus].map(this.escapeCsv).join(',')));
    } else if (this.view === 'acciones') {
      rows.push(['Rol','Acción','Descripción'].join(','));
      this.itemsFiltrados.forEach((r: any) => rows.push([r.rol, r.accion, r.descripcion].map(this.escapeCsv).join(',')));
    } else {
      rows.push(['Rol','Descripción','Tipo'].join(','));
      this.itemsFiltrados.forEach((r: any) => rows.push([r.rol, r.descripcion, r.tipo].map(this.escapeCsv).join(',')));
    }

    const csv = rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
  const filename = `${this.getSelectedAppName() || this.selectedApp || 'report'}_${this.view}.csv`;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  private escapeCsv(val: any) {
    if (val === null || val === undefined) return '';
    const s = String(val);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }

    regresarAFiltro() {
    this.selectedApp = null;
  }

}
