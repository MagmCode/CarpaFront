import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-drivers',
  templateUrl: './drivers.component.html',
  styleUrls: ['./drivers.component.scss']
})
export class DriversComponent implements OnInit {
  // data model
  drivers: DriverRecord[] = [];
  page: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;
  driversFiltrados: DriverRecord[] = [];
  driversPaginados: DriverRecord[] = [];
  searchTerm: string = '';
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  modalModo: 'agregar' | 'editar' = 'agregar';
  newDriver: DriverRecord = { driver: '', base: '', descripcion: '', host: '', puerto: '', status: 'Activo' };
  selectedDriver: DriverRecord | null = null;

  constructor(private modalService: NgbModal) { }

  ngOnInit(): void {
    // seed sample
    this.drivers = [
      { driver: 'org.postgresql.Driver', base: 'Postgres', descripcion: 'PG DB', host: 'db-server', puerto: 5432, status: 'Activo' },
      { driver: 'com.mysql.jdbc.Driver', base: 'MySQL', descripcion: 'MySQL DB', host: 'mysql-host', puerto: 3306, status: 'Activo' },
      { driver: 'oracle.jdbc.OracleDriver', base: 'Oracle', descripcion: 'Oracle DB', host: 'oracle-host', puerto: 1521, status: 'Inactivo' }
    ];
    this.filtrarDrivers();
  }

  filtrarDrivers() {
    const term = this.searchTerm.trim().toLowerCase();
    this.driversFiltrados = this.drivers.filter(d =>
      term === '' || (d.driver || '').toLowerCase().includes(term) || (d.base || '').toLowerCase().includes(term) || (d.descripcion || '').toLowerCase().includes(term)
    );
    this.page = 1;
    this.actualizarPaginacion();
  }

  actualizarPaginacion() {
    this.totalPages = Math.max(1, Math.ceil(this.driversFiltrados.length / this.pageSize));
    const start = (this.page - 1) * this.pageSize;
    this.driversPaginados = this.driversFiltrados.slice(start, start + this.pageSize);
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
    this.driversFiltrados.sort((a: any, b: any) => {
      const valA = (a[col] || '').toString();
      const valB = (b[col] || '').toString();
      if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    this.actualizarPaginacion();
  }

  openAddDriverModal(content: any) {
    this.modalModo = 'agregar';
    this.newDriver = { driver: '', base: '', descripcion: '', host: '', puerto: '', status: 'Activo' };
    this.modalService.open(content, { centered: true });
  }

  openEditDriverModal(content: any, drv: DriverRecord) {
    this.modalModo = 'editar';
    this.newDriver = { ...drv };
    this.selectedDriver = drv;
    this.modalService.open(content, { centered: true });
  }

  saveDriver(modal: any) {
    if (this.modalModo === 'agregar') {
      this.drivers.unshift({ ...this.newDriver });
    } else if (this.modalModo === 'editar' && this.selectedDriver) {
      const idx = this.drivers.indexOf(this.selectedDriver);
      if (idx > -1) this.drivers[idx] = { ...this.newDriver };
    }
    this.filtrarDrivers();
    modal.close();
  }

  confirmDeleteDriver(drv: DriverRecord) {
    Swal.fire({
      title: `¿Eliminar driver?`,
      text: `Driver: ${drv.driver}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((res) => {
      if (res.isConfirmed) {
        this.drivers = this.drivers.filter(d => d !== drv);
        this.filtrarDrivers();
        Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1200, showConfirmButton: false });
      }
    });
  }

}

export interface DriverRecord {
  driver: string;
  base: string;
  descripcion?: string;
  host?: string;
  puerto?: number | string;
  status?: 'Activo' | 'Inactivo';
}

