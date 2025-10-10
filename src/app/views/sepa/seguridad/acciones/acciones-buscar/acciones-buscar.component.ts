import { Component, OnInit, AfterViewInit, TemplateRef } from '@angular/core';
import { DataTable } from "simple-datatables";
import { AplicacionesService, Aplicacion } from 'src/app/services/aplicaciones-services/aplicaciones.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

interface Accion {
  url: string;
  descripcion: string;
  aplicacion: string;
  seguridad: boolean | null; 
}

@Component({
  selector: 'app-acciones-buscar',
  templateUrl: './acciones-buscar.component.html',
  styleUrls: ['./acciones-buscar.component.scss']
})
export class AccionesBuscarComponent implements OnInit, AfterViewInit {

  aplicaciones: Aplicacion[] = [];
  acciones: Accion[] =[
    
    { url: '/usuarios', descripcion: 'Gestión de Usuarios', aplicacion: 'Gestión de Usuarios', seguridad: null },
    { url: '/inventario', descripcion: 'Control de inventario', aplicacion: 'Inventario', seguridad: null },
  ];
  newAction: Accion = { url: '', descripcion: '', aplicacion: '', seguridad: null };
  
  constructor(
    private aplicacionesService: AplicacionesService,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    this.aplicaciones = this.aplicacionesService.getAplicaciones();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      new DataTable("#accionesTable");
    }, 0);
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
