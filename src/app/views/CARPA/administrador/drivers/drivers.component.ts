import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { DriversService } from 'src/app/services/conexiones/drivers.service';

@Component({
  selector: 'app-drivers',
  templateUrl: './drivers.component.html',
  styleUrls: ['./drivers.component.scss']
})
export class DriversComponent implements OnInit {

  loading = false;
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
  newDriver: DriverRecord = { id: 0, connectionName: '', datasourceType: '', jdbcUrl: '', username: '', password: '', driverClassName: '', enabled: true, profile: '' };
  selectedDriver: DriverRecord | null = null;

  constructor(private modalService: NgbModal, private driversService: DriversService) { }


  ngOnInit(): void {
    // Suscribirse al observable reactivo del servicio
    this.driversService.getDrivers$().subscribe(drivers => {
      this.drivers = drivers || [];
      this.filtrarDrivers();
    });
    this.loading = true;
    // Cargar desde backend
    this.driversService.loadDrivers().subscribe({
      next: () => {
        this.loading = false;
      },
      error: () => {
        Swal.fire({ title: 'Error', text: 'No se pudieron cargar los drivers.', icon: 'error' });
        this.loading = false;
      }
    });
  }

  filtrarDrivers() {
    const term = this.searchTerm.trim().toLowerCase();
    this.driversFiltrados = this.drivers.filter(d =>
      term === '' ||
      (d.connectionName || '').toLowerCase().includes(term) ||
      (d.datasourceType || '').toLowerCase().includes(term) ||
      (d.jdbcUrl || '').toLowerCase().includes(term) ||
      (d.username || '').toLowerCase().includes(term) ||
      (d.driverClassName || '').toLowerCase().includes(term) ||
      (d.profile || '').toLowerCase().includes(term)
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
    this.newDriver = { id: 0, connectionName: '', datasourceType: '', jdbcUrl: '', username: '', password: '', driverClassName: '', enabled: true, profile: '' };
    this.modalService.open(content, { centered: true });
  }

  openEditDriverModal(content: any, drv: DriverRecord) {
    this.modalModo = 'editar';
    this.newDriver = { ...drv };
    this.selectedDriver = drv;
    this.modalService.open(content, { centered: true });
    console.log('Editar driver:', drv);
  }

  saveDriver(modal: any) {
    if (this.modalModo === 'agregar') {
      const payload = {
        connectionName: this.newDriver.connectionName,
        datasourceType: this.newDriver.datasourceType,
        jdbcUrl: this.newDriver.jdbcUrl,
        username: this.newDriver.username,
        password: this.newDriver.password || '',
        driverClassName: this.newDriver.driverClassName,
        enabled: this.newDriver.enabled,
        profile: this.newDriver.profile
      };
      this.driversService.crearDriver(payload).subscribe({
        next: (created) => {
          // La lista se actualiza automáticamente por el Subject
          this.filtrarDrivers();
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Driver creado',
            text: `${created.connectionName}`,
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
          });
          modal.close();
        },
        error: () => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo crear el driver.',
            position: 'center',
            showConfirmButton: true
          });
        }
      });
    } else if (this.modalModo === 'editar' && this.selectedDriver) {
      const payload = {
        id: this.newDriver.id ,
        connectionName: this.newDriver.connectionName,
        datasourceType: this.newDriver.datasourceType,
        jdbcUrl: this.newDriver.jdbcUrl,
        username: this.newDriver.username,
        password: this.newDriver.password || '',
        driverClassName: this.newDriver.driverClassName,
        enabled: this.newDriver.enabled,
        profile: this.newDriver.profile
      };
      this.driversService.modificarDriver(payload).subscribe({
        next: (updated) => {
          // La lista se actualiza automáticamente por el Subject
          this.filtrarDrivers();
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Driver actualizado',
            text: `${updated.connectionName}`,
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
          });
          modal.close();
        },
        error: () => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo modificar el driver.',
            position: 'center',
            showConfirmButton: true
          });
        }
      });
    }
  }

  confirmDeleteDriver(drv: DriverRecord) {
    Swal.fire({
      title: `¿Eliminar driver?`,
      text: `Conexión: ${drv.connectionName}`,
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
  id?: number;
  connectionName: string;
  datasourceType: string;
  jdbcUrl: string;
  username: string;
  password?: string;
  driverClassName: string;
  enabled: boolean;
  profile: string;
}

