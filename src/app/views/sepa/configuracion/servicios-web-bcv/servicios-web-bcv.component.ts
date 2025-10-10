import { Component, OnInit, TemplateRef } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

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
    { sistema: 'TESORERIA', usuario: 'tesorero', clave: '********', claveReal: 'teso789' }
  ];

  nuevoRegistro: any = {};

  constructor(private modalService: NgbModal) { }

  registroSeleccionado: RegistroBCV | null = null;

  editarRegistroSeleccionado: any = {};

  ngOnInit(): void {
  }

  openAddModal(content: TemplateRef<any>) {
    this.nuevoRegistro = {};
    this.modalService.open(content, { centered: true });
  }

  guardarRegistro(modal: any) {
     if (this.nuevoRegistro.clave === this.nuevoRegistro.repetirClave) {
    this.registros.push({
      sistema: this.nuevoRegistro.sistema,
      usuario: this.nuevoRegistro.usuario,
      clave: '********',
      claveReal: this.nuevoRegistro.clave
    });
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
    this,this.modalService.open(template, { centered: true });
  }

  guardarEdicionRegistro(modal: any) {
   if (this.nuevoRegistro.clave === this.nuevoRegistro.repetirClave) {
    this.registros.push({
      sistema: this.nuevoRegistro.sistema,
      usuario: this.nuevoRegistro.usuario,
      clave: '********',
      claveReal: this.nuevoRegistro.clave
    });
    modal.close();
  } else {
    alert('Las claves no coinciden');
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
}
