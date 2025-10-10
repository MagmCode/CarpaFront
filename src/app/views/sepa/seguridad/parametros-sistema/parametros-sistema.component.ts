import { Component, OnInit, TemplateRef } from '@angular/core';
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

  constructor(
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
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
      modal.close();
  }

  guardarEdicionParametro(modal: any) {
    if (this.parametroSeleccionado) {
      const idx = this.parametros.findIndex(p => p.nombre === this.parametroSeleccionado!.nombre);
      if (idx !== -1) {
        this.parametros[idx] = { ...this.parametroSeleccionado };
      }
    }
    modal.close();
  }

  addParametro(modal: any) {
    this.parametros.push({ ...this.nuevoParametro });
    modal.close();
  }

  salir() {
  }
}
