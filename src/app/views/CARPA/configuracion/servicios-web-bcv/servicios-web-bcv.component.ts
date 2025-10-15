import { Component, OnInit, TemplateRef } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';

interface RegistroBCV {
  sistema:string;
  usuario: string;
  clave: string;
  claveReal: string;
  verClave?: boolean;
}

@Component({
  selector: 'app-servicios-web-bcv',
  templateUrl: './servicios-web-bcv.component.html',
  styleUrls: ['./servicios-web-bcv.component.scss']
})
export class ServiciosWebBcvComponent implements OnInit {

  registros: RegistroBCV[] = [
    { sistema: 'SISCON', usuario: 'admin', clave: '********', claveReal: 'admin123' },
    { sistema: 'PAGOS', usuario: 'usuario1', clave: '********', claveReal: 'pagos456' },
    { sistema: 'TESORERIA', usuario: 'tesorero', clave: '********', claveReal: 'teso789' },
    { sistema: 'CONTABILIDAD', usuario: 'conta', clave: '********', claveReal: 'conta001' },
    { sistema: 'NOMINA', usuario: 'nomina', clave: '********', claveReal: 'nom123' },
    { sistema: 'FACTURACION', usuario: 'factu', clave: '********', claveReal: 'fac987' },
    { sistema: 'ALMACEN', usuario: 'almacen', clave: '********', claveReal: 'alm555' },
    { sistema: 'VENTAS', usuario: 'ventas', clave: '********', claveReal: 'ven321' },
    { sistema: 'COMPRAS', usuario: 'compras', clave: '********', claveReal: 'com222' },
    { sistema: 'RRHH', usuario: 'rrhh', clave: '********', claveReal: 'rrhh999' },
    { sistema: 'REPORTES', usuario: 'reportes', clave: '********', claveReal: 'rep444' },
    { sistema: 'PRODUCCION', usuario: 'prod', clave: '********', claveReal: 'prod007' }
  ];

  nuevoRegistro: any = {};

  // estados para mostrar/ocultar claves en el modal de agregar
  nuevoMostrarClave: boolean = false;
  nuevoMostrarRepetirClave: boolean = false;

  // busqueda y paginacion
  searchTerm: string = '';
  page: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;
  registrosFiltrados: RegistroBCV[] = [];
  registrosPaginados: RegistroBCV[] = [];

  constructor(private modalService: NgbModal) { }

  registroSeleccionado: RegistroBCV | null = null;

  editarRegistroSeleccionado: any = {};

  ngOnInit(): void {
    this.filtrarRegistros();
  }

  openAddModal(content: TemplateRef<any>) {
    // inicializar campos vacíos para añadir un nuevo registro
    this.nuevoRegistro = { sistema: '', usuario: '', clave: '', repetirClave: '' };
    // resetear estados de visibilidad de clave
    this.nuevoMostrarClave = false;
    this.nuevoMostrarRepetirClave = false;
    this.modalService.open(content, { centered: true });
  }

  toggleNuevoMostrarClave(which: 'clave' | 'repetir') {
    if (which === 'clave') this.nuevoMostrarClave = !this.nuevoMostrarClave;
    else this.nuevoMostrarRepetirClave = !this.nuevoMostrarRepetirClave;
  }

  guardarRegistro(modal: any) {
     if (this.nuevoRegistro.clave === this.nuevoRegistro.repetirClave) {
    this.registros.push({
      sistema: this.nuevoRegistro.sistema,
      usuario: this.nuevoRegistro.usuario,
      clave: '********',
      claveReal: this.nuevoRegistro.clave
    });
    // refrescar listado y paginación
    this.filtrarRegistros();
    modal.close();
  } else {
    alert('Las claves no coinciden');
  }
  }

  openEliminarModal(registro: RegistroBCV, template: TemplateRef<any>) {
    this.registroSeleccionado = registro;
    this.modalService.open(template, { centered: true });
  }

  eliminarRegistroConfirmado(modal: any) {
    if (this.registroSeleccionado) {
      this.registros = this.registros.filter(r => r !== this.registroSeleccionado);
      this.registroSeleccionado = null;
      // refrescar listado y paginación
      this.filtrarRegistros();
      modal.close();
    }
  }

  openEditarModal(registro: RegistroBCV, template: TemplateRef<any>) {
    this.editarRegistroSeleccionado = {
      sistema: registro.sistema,
      usuario: registro.usuario,
      clave: '',
      repetirClave: ''
    };
    this.registroSeleccionado = registro;
    this.modalService.open(template, { centered: true });
  }

  confirmarEliminarRegistro(registro: RegistroBCV) {
    Swal.fire({
      title: `¿Desea eliminar el registro "${registro.sistema}"?`,
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.registros = this.registros.filter(r => r !== registro);
        this.filtrarRegistros();
        Swal.fire({
          title: 'Eliminado',
          text: `El registro "${registro.sistema}" ha sido eliminado.`,
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
  }

  guardarEdicionRegistro(modal: any) {
    // Guardar cambios en el registro seleccionado
    if (this.editarRegistroSeleccionado && this.registroSeleccionado) {
      // Si se ingresó una nueva clave, actualizamos claveReal
      if (this.editarRegistroSeleccionado.clave && this.editarRegistroSeleccionado.clave === this.editarRegistroSeleccionado.repetirClave) {
        this.registroSeleccionado.claveReal = this.editarRegistroSeleccionado.clave;
        this.registroSeleccionado.clave = '********';
      } else if (this.editarRegistroSeleccionado.clave || this.editarRegistroSeleccionado.repetirClave) {
        alert('Las claves no coinciden');
        return;
      }
      // usuario no editable del sistema, solo actualizar usuario si lo cambian
      this.registroSeleccionado.usuario = this.editarRegistroSeleccionado.usuario;
      // refrescar listado
      this.filtrarRegistros();
      modal.close();
    }
  }

  toggleVerClave(registro: RegistroBCV) {
    registro.verClave = !registro.verClave;
  }

  getClaveOculta(clave: string): string {
  return clave ? '*'.repeat(clave.length) : '';
  }

  salir() {
    window.history.back();
  }

  // ---- Busqueda y paginacion ----
  filtrarRegistros(): void {
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.trim().toLowerCase();
      this.registrosFiltrados = this.registros.filter(r =>
        (r.sistema || '').toLowerCase().includes(term) ||
        (r.usuario || '').toLowerCase().includes(term)
      );
    } else {
      this.registrosFiltrados = [...this.registros];
    }
    this.page = 1;
    this.actualizarPaginacion();
  }

  actualizarPaginacion(): void {
    this.totalPages = Math.max(1, Math.ceil(this.registrosFiltrados.length / this.pageSize));
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.registrosPaginados = this.registrosFiltrados.slice(start, end);
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
