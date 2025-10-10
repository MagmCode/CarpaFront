import { Component, OnInit } from '@angular/core';
import { AplicacionesService, Aplicacion } from 'src/app/services/aplicaciones-services/aplicaciones.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-agregar-usuarios',
  templateUrl: './agregar-usuarios.component.html',
  styleUrls: ['./agregar-usuarios.component.scss']
})
export class AgregarUsuariosComponent implements OnInit {

  aplicaciones: Aplicacion[] = [];
  aplicacionSeleccionada: string = '';
  rolSeleccionado: string = '';
  usuariosLote: string = '';

  rolesPorAplicacion: { [key: string]: string[] } = {
    'Gestión Usuarios': ['ADMIN', 'USER', 'SUPERVISOR'],
    'Inventario': ['INV_ADMIN', 'INV_USER', 'INV_VIEWER']
  };

  constructor(
    private aplicacionesService: AplicacionesService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.aplicaciones = this.aplicacionesService.getAplicaciones();
  }

  onAplicacionChange() {
    this.rolSeleccionado = '';
  }

  guardar() {
    console.log('Aplicación:', this.aplicacionSeleccionada);
    console.log('Rol:', this.rolSeleccionado);
    console.log('Usuarios:', this.usuariosLote.split('\n'));
  }

  salir () {
  }

}
