import { Component, OnInit, TemplateRef } from '@angular/core';
import { AplicacionesService, Aplicacion } from 'src/app/services/aplicaciones-services/aplicaciones.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

interface NuevaAccion {
  url: string;
  descripcion: string;
  aplicacion: string;
  seguridad: boolean | null;
}

@Component({
  selector: 'app-acciones',
  templateUrl: './acciones.component.html',
  styleUrls: ['./acciones.component.scss']
})
export class AccionesComponent implements OnInit {

  aplicaciones: Aplicacion[] = [];
  newAction: NuevaAccion = { url: '', descripcion: '', aplicacion: '', seguridad: null };

  constructor(
    private aplicacionesService: AplicacionesService,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    this.aplicaciones = this.aplicacionesService.getAplicaciones();
  }

  exitMenu(): void {
    console.log('Salir del menú de aplicaciones');
  }

  openAddActionModal(content: TemplateRef<any>) {
    this.newAction = { url: '', descripcion: '', aplicacion: '', seguridad: null };
    this.modalService.open(content, { centered: true });
  }

  addAction(modal: any) {
    // Aquí puedes guardar la acción, por ejemplo: this.acciones.push({ ...this.newAction });
    modal.close();
  }

}
