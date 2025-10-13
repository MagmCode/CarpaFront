import { Component, OnInit, TemplateRef } from '@angular/core';
import Swal from 'sweetalert2';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

interface Parametro {
  nombre: string;
  valor: string;
}

@Component({
  selector: 'app-parametros-sistema',
  templateUrl: './parametros-sistema.component.html',
  styleUrls: ['./parametros-sistema.component.scss']
})
export class ParametrosSistemaComponent implements OnInit {

  parametros: Parametro[] =[
    { nombre: 'Tiempo de sesión', valor: '30 minutos' },
    { nombre: 'Moneda', valor: 'USD' },
    { nombre: 'Idioma', valor: 'Español' }
  ];

  parametroSeleccionado: Parametro | null = null;
  nuevoParametro: Parametro = { nombre: '', valor: '' };

  // busqueda y paginacion
  searchTerm: string = '';
  page: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;
  parametrosFiltrados: Parametro[] = [];
  parametrosPaginados: Parametro[] = [];

  constructor(
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    this.filtrarParametros();
  }

  openEliminarModal(parametro: Parametro, template: TemplateRef<any>) {
    this.parametroSeleccionado = parametro;
    this.modalService.open(template, { centered: true });
  }

  openEditarModal(parametro: Parametro, template: TemplateRef<any>) {
    this.parametroSeleccionado = { ...parametro };
    this.modalService.open(template, { centered: true });
  }

  openAddParametroModal(template: TemplateRef<any>) {
    this.nuevoParametro = { nombre: '', valor: '' };
    this.modalService.open(template, { centered: true });
  }

  eliminarParametro(parametro: Parametro, modal: any) {
    this.parametros = this.parametros.filter(p => p.nombre !== parametro.nombre);
      this.filtrarParametros();
      modal.close();
  }

  guardarEdicionParametro(modal: any) {
    if (this.parametroSeleccionado) {
      const idx = this.parametros.findIndex(p => p.nombre === this.parametroSeleccionado!.nombre);
      if (idx !== -1) {
        this.parametros[idx] = { ...this.parametroSeleccionado };
      }
    }
    this.filtrarParametros();
    modal.close();
  }

  addParametro(modal: any) {
    this.parametros.push({ ...this.nuevoParametro });
    this.filtrarParametros();
    modal.close();
  }

  confirmarEliminarParametro(parametro: Parametro) {
    Swal.fire({
      title: `¿Desea eliminar el parámetro "${parametro.nombre}"?`,
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.parametros = this.parametros.filter(p => p.nombre !== parametro.nombre);
        this.filtrarParametros();
        Swal.fire({
          title: 'Eliminado',
          text: `El parámetro "${parametro.nombre}" ha sido eliminado.`,
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
  }

  // ---- Busqueda y paginacion ----
  filtrarParametros(): void {
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.trim().toLowerCase();
      this.parametrosFiltrados = this.parametros.filter(p =>
        (p.nombre || '').toLowerCase().includes(term) ||
        (p.valor || '').toLowerCase().includes(term)
      );
    } else {
      this.parametrosFiltrados = [...this.parametros];
    }
    this.page = 1;
    this.actualizarPaginacion();
  }

  actualizarPaginacion(): void {
    this.totalPages = Math.max(1, Math.ceil(this.parametrosFiltrados.length / this.pageSize));
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.parametrosPaginados = this.parametrosFiltrados.slice(start, end);
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

  salir() {
  }
}
