import { Component, OnInit } from '@angular/core';

type ViewMode = 'usuarios' | 'acciones' | 'roles';

@Component({
  selector: 'app-reportes-aplicacion',
  templateUrl: './reportes-aplicacion.component.html',
  styleUrls: ['./reportes-aplicacion.component.scss']
})
export class ReportesAplicacionComponent implements OnInit {

  // aplicaciones de ejemplo
  aplicaciones = [
    { id: 'app1', nombre: 'Aplicación A' },
    { id: 'app2', nombre: 'Aplicación B' },
    { id: 'app3', nombre: 'Aplicación C' }
  ];

  selectedApp: string | null = null;

  // vista actual
  view: ViewMode = 'usuarios';

  // datos de ejemplo (cada registro referencia una aplicacion)
  usuarios: any[] = [];
  acciones: any[] = [];
  roles: any[] = [];

  // filtrado y paginación
  searchTerm: string = '';
  page: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;
  itemsFiltrados: any[] = [];
  itemsPaginados: any[] = [];

  constructor() { }

  ngOnInit(): void {
    this.seedSampleData();
  }

  // helpers para el template: contar por aplicacion (evita arrow functions inline en el template)
  getUsuariosCount(): number {
    if (!this.selectedApp) return 0;
    return this.usuarios.filter(u => u.aplicacion === this.selectedApp).length;
  }

  getAccionesCount(): number {
    if (!this.selectedApp) return 0;
    return this.acciones.filter(a => a.aplicacion === this.selectedApp).length;
  }

  getRolesCount(): number {
    if (!this.selectedApp) return 0;
    return this.roles.filter(r => r.aplicacion === this.selectedApp).length;
  }

  seedSampleData() {
    // crear datos de ejemplo para cada aplicacion
    this.aplicaciones.forEach((app, ai) => {
      // usuarios
      for (let i = 1; i <= 23; i++) {
        this.usuarios.push({
          aplicacion: app.id,
          usuarioId: `${app.id}-u${i}`,
          rol: ['Admin', 'Editor', 'Viewer'][i % 3],
          nombres: `Nombre ${i} ${app.nombre}`,
          apellidos: `Apellido ${i}`,
          email: `user${i}@${app.id}.local`,
          estatus: i % 4 === 0 ? 'Inactivo' : 'Activo'
        });
      }

      // acciones
      for (let i = 1; i <= 12; i++) {
        this.acciones.push({
          aplicacion: app.id,
          rol: ['Admin','Editor','Viewer'][i % 3],
          accion: `ACC_${i}`,
          descripcion: `Descripción de la acción ${i} en ${app.nombre}`
        });
      }

      // roles
      ['Admin','Editor','Viewer'].forEach((r, idx) => {
        this.roles.push({ aplicacion: app.id, rol: r, descripcion: `${r} de ${app.nombre}`, tipo: idx === 0 ? 'Sistema' : 'Normal' });
      });
    });
  }

  // cuando se selecciona app o cambia vista
  onAppSelected() {
    this.searchTerm = '';
    this.page = 1;
    this.updateList();
  }

  setView(v: ViewMode) {
    this.view = v;
    this.searchTerm = '';
    this.page = 1;
    this.updateList();
  }

  updateList() {
    if (!this.selectedApp) {
      this.itemsFiltrados = [];
      this.itemsPaginados = [];
      this.totalPages = 1;
      return;
    }

    let source: any[] = [];
    if (this.view === 'usuarios') source = this.usuarios.filter(u => u.aplicacion === this.selectedApp);
    if (this.view === 'acciones') source = this.acciones.filter(a => a.aplicacion === this.selectedApp);
    if (this.view === 'roles') source = this.roles.filter(r => r.aplicacion === this.selectedApp);

    if (this.searchTerm && this.searchTerm.trim()) {
      const term = this.searchTerm.trim().toLowerCase();
      this.itemsFiltrados = source.filter(item => {
        // buscar en las propiedades relevantes según la vista
        if (this.view === 'usuarios') {
          return (item.usuarioId || '').toLowerCase().includes(term)
            || (item.rol || '').toLowerCase().includes(term)
            || (item.nombres || '').toLowerCase().includes(term)
            || (item.apellidos || '').toLowerCase().includes(term)
            || (item.email || '').toLowerCase().includes(term)
            || (item.estatus || '').toLowerCase().includes(term);
        }
        if (this.view === 'acciones') {
          return (item.rol || '').toLowerCase().includes(term)
            || (item.accion || '').toLowerCase().includes(term)
            || (item.descripcion || '').toLowerCase().includes(term);
        }
        // roles
        return (item.rol || '').toLowerCase().includes(term)
          || (item.descripcion || '').toLowerCase().includes(term)
          || (item.tipo || '').toLowerCase().includes(term);
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
    const filename = `${this.selectedApp || 'report'}_${this.view}.csv`;
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

}
