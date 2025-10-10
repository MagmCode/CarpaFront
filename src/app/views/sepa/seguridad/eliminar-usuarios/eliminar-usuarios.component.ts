import { Component, OnInit } from '@angular/core';
import { AplicacionesService, Aplicacion } from 'src/app/services/aplicaciones-services/aplicaciones.service';

@Component({
  selector: 'app-eliminar-usuarios',
  templateUrl: './eliminar-usuarios.component.html',
  styleUrls: ['./eliminar-usuarios.component.scss']
})
export class EliminarUsuariosComponent implements OnInit {

  aplicaciones: Aplicacion[] = [];
  aplicacionSeleccionada: string = '';
  usuariosLote: string = '';

  constructor(
    private aplicacionesService: AplicacionesService
  ) { }

  ngOnInit(): void {
    this.aplicaciones = this.aplicacionesService.getAplicaciones(); 
    // Datos de prueba opcionales:
    // this.aplicacionSeleccionada = this.aplicaciones[0]?.nombre || '';
    // this.usuariosLote = 'juan.perez\nana.garcia\ncarlos.lopez';
  }

  eliminarUsuarios() {
    const usuarios = this.usuariosLote.split('\n').map(u => u.trim()).filter(u => u);
    console.log('Aplicación:', this.aplicacionSeleccionada);
    console.log('Usuarios a eliminar:', usuarios);
  }

}
