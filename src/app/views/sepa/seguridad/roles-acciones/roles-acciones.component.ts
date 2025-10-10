import { Component, OnInit } from '@angular/core';
import { AplicacionesService, Aplicacion } from 'src/app/services/aplicaciones-services/aplicaciones.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-roles-acciones',
  templateUrl: './roles-acciones.component.html',
  styleUrls: ['./roles-acciones.component.scss']
})
export class RolesAccionesComponent implements OnInit {

  alias: string = '';
  uso: string = '';
  aplicacion: string = '';
  aplicaciones: Aplicacion[] = [];

  constructor(
    private aplicacionesService: AplicacionesService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.aplicaciones = this.aplicacionesService.getAplicaciones();
  }

  consultar() {
    this.router.navigate(['/seguridad/roles-acciones/consultas']);
    console.log('Consultar:', this.alias, this.uso, this.aplicacion);
  }

  salir() {
    console.log('Salir');
  }
}
