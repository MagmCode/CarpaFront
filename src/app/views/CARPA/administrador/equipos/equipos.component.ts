import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-equipos',
  templateUrl: './equipos.component.html',
  styleUrls: ['./equipos.component.scss']
})
export class EquiposComponent implements OnInit {
  equipos: EquipoRecord[] = [];
  page: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;
  equiposFiltrados: EquipoRecord[] = [];
  equiposPaginados: EquipoRecord[] = [];
  searchTerm: string = '';
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  modalModo: 'agregar' | 'editar' = 'agregar';
  newEquipo: EquipoRecord = { host: '', mac: '', descripcion: '', identificador: '', tipo: '', status: 'Activo' };
  selectedEquipo: EquipoRecord | null = null;

  constructor(private modalService: NgbModal) { }

  ngOnInit(): void {
    // seed sample
    this.equipos = [
      { host: '192.168.1.10', mac: 'AA:BB:CC:DD:EE:01', tipo: 'PC', identificador: 'PC-01', descripcion: 'Equipo de oficina', status: 'Activo' },
      { host: '192.168.1.20', mac: 'AA:BB:CC:DD:EE:02', tipo: 'Laptop', identificador: 'LAP-02', descripcion: 'Laptop gerencia', status: 'Activo' },
      { host: '192.168.1.30', mac: 'AA:BB:CC:DD:EE:03', tipo: 'Servidor', identificador: 'SRV-03', descripcion: 'Servidor principal', status: 'Inactivo' }
    ];
    this.filtrarEquipos();
  }

  filtrarEquipos() {
    const term = this.searchTerm.trim().toLowerCase();
    this.equiposFiltrados = this.equipos.filter(e =>
      term === '' || (e.host || '').toLowerCase().includes(term) || (e.mac || '').toLowerCase().includes(term) || (e.tipo || '').toLowerCase().includes(term) || (e.identificador || '').toLowerCase().includes(term) || (e.descripcion || '').toLowerCase().includes(term)
    );
    this.page = 1;
    this.actualizarPaginacion();
  }

  actualizarPaginacion() {
    this.totalPages = Math.max(1, Math.ceil(this.equiposFiltrados.length / this.pageSize));
    const start = (this.page - 1) * this.pageSize;
    this.equiposPaginados = this.equiposFiltrados.slice(start, start + this.pageSize);
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

  ordenarPor(col: string) {
    if (this.sortColumn === col) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = col;
      this.sortDirection = 'asc';
    }
    this.equiposFiltrados.sort((a: any, b: any) => {
      const valA = (a[col] || '').toString();
      const valB = (b[col] || '').toString();
      if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    this.actualizarPaginacion();
  }

  openAddEquipoModal(content: any) {
    this.modalModo = 'agregar';
    this.newEquipo = { host: '', mac: '', descripcion: '', identificador: '', tipo: '', status: 'Activo' };
    this.modalService.open(content, { centered: true });
  }

  openEditEquipoModal(content: any, eq: EquipoRecord) {
    this.modalModo = 'editar';
    this.newEquipo = { ...eq };
    this.selectedEquipo = eq;
    this.modalService.open(content, { centered: true });
  }

  saveEquipo(modal: any) {
    if (this.modalModo === 'agregar') {
      this.equipos.unshift({ ...this.newEquipo });
    } else if (this.modalModo === 'editar' && this.selectedEquipo) {
      const idx = this.equipos.indexOf(this.selectedEquipo);
      if (idx > -1) this.equipos[idx] = { ...this.newEquipo };
    }
    this.filtrarEquipos();
    modal.close();
  }

  confirmDeleteEquipo(eq: EquipoRecord) {
    Swal.fire({
      title: `¿Eliminar equipo?`,
      text: `Identificador: ${eq.identificador}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((res) => {
      if (res.isConfirmed) {
        this.equipos = this.equipos.filter(e => e !== eq);
        this.filtrarEquipos();
        Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1200, showConfirmButton: false });
      }
    });
  }
}

export interface EquipoRecord {
  host: string;
  mac: string;
  tipo: string;
  identificador: string;
  descripcion?: string;
  status?: 'Activo' | 'Inactivo';
}
