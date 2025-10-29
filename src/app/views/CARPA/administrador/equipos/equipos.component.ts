import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { EquiposService } from 'src/app/services/conexiones/equipos.service';

@Component({
  selector: 'app-equipos',
  templateUrl: './equipos.component.html',
  styleUrls: ['./equipos.component.scss']
})
export class EquiposComponent implements OnInit {
  loading = false;
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
  newEquipo: EquipoRecord = { host: '', mac: '', description: '', identifier: '', type: '', status: 'Activo' };
  selectedEquipo: EquipoRecord | null = null;

  constructor(private modalService: NgbModal, private equiposService: EquiposService) { }

  ngOnInit(): void {
    // Suscribirse al observable reactivo del servicio
    this.equiposService.getEquipos$().subscribe(equipos => {
      this.equipos = equipos || [];
      this.filtrarEquipos();
    });
    this.loading = true;
    // Cargar desde backend
    this.equiposService.loadEquipos().subscribe({
      next: () => {
        this.loading = false;
      },
      error: () => {
        Swal.fire({ title: 'Error', text: 'No se pudieron cargar los equipos.', icon: 'error', position: 'center' });
        this.loading = false;
      }
    });
  }

  filtrarEquipos() {
    const term = this.searchTerm.trim().toLowerCase();
    this.equiposFiltrados = this.equipos.filter(e =>
      term === '' || (e.host || '').toLowerCase().includes(term) || (e.mac || '').toLowerCase().includes(term) || (e.type || '').toLowerCase().includes(term) || (e.identifier || '').toLowerCase().includes(term) || (e.description || '').toLowerCase().includes(term)
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
  this.newEquipo = { host: '', mac: '', description: '', identifier: '', type: '', status: 'Activo' };
    this.modalService.open(content, { centered: true });
  }

  openEditEquipoModal(content: any, eq: EquipoRecord) {
    this.modalModo = 'editar';
    // Ajustar status para el modal
    let statusValue = eq.status;
    if (statusValue === '1') statusValue = 'Activo';
    else if (statusValue === '0') statusValue = 'Inactivo';
    this.newEquipo = { ...eq, status: statusValue };
    this.selectedEquipo = eq;
    console.log('Editar equipo:', eq);
    this.modalService.open(content, { centered: true });
  }

  saveEquipo(modal: any) {
    if (this.modalModo === 'agregar') {
      // Ajustar datos para el backend
      const data = {
        host: this.newEquipo.host,
        mac: this.newEquipo.mac,
        description: this.newEquipo.description || '',
        identifier: this.newEquipo.identifier || '',
        type: this.newEquipo.type || '',
        status: this.newEquipo.status === 'Activo' ? '1' : '0',
      };
      this.equiposService.crearEquipo(data).subscribe({
        next: (created) => {
          // La lista se actualiza automáticamente por el Subject
          this.filtrarEquipos();
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Equipo creado',
            text: `${created.host}`,
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
            text: 'No se pudo crear el equipo.',
            position: 'center',
            showConfirmButton: true
          });
        }
      });
    } else if (this.modalModo === 'editar' && this.selectedEquipo) {
      const payload = {
        id: this.newEquipo.id,
        host: this.newEquipo.host,
        mac: this.newEquipo.mac,
        description: this.newEquipo.description || '',
        identifier: this.newEquipo.identifier || '',
        type: this.newEquipo.type || '',
        status: this.newEquipo.status === 'Activo' ? '1' : '0',
      };
      this.equiposService.modificarEquipo(payload).subscribe({
        next: (updated) => {
          this.filtrarEquipos();
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Equipo actualizado',
            text: `${updated.description}`,
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
            text: 'No se pudo modificar el equipo.',
            position: 'center',
            showConfirmButton: true
          });
        }
      });
    }
  }

  confirmDeleteEquipo(eq: EquipoRecord) {
    Swal.fire({
      title: `¿Eliminar equipo?`,
  text: `Identificador: ${eq.identifier}`,
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
  id?: string;
  host: string;
  mac: string;
  description?: string;
  identifier?: string;
  type?: string;
  status?: string;
}
