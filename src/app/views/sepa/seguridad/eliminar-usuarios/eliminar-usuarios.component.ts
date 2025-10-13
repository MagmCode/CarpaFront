import { Component, OnInit } from '@angular/core';
import { AplicacionesService, Aplicacion } from 'src/app/services/aplicaciones-services/aplicaciones.service';
import Swal from 'sweetalert2';

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
    if (!this.aplicacionSeleccionada) {
      Swal.fire('Error', 'Seleccione una aplicación antes de eliminar usuarios.', 'error');
      return;
    }
    if (usuarios.length === 0) {
      Swal.fire('Atención', 'No se han ingresado usuarios para eliminar.', 'warning');
      return;
    }

    Swal.fire({
      title: `¿Está seguro?`,
      html: `Desea eliminar <b>${usuarios.length}</b> usuario(s) de la aplicación <b>${this.aplicacionSeleccionada}</b>. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        // Aquí se integraría la lógica real de eliminación (llamada al servicio)
        console.log('Aplicación:', this.aplicacionSeleccionada);
        console.log('Usuarios a eliminar:', usuarios);
        // Mostrar toast tipo snackbar en top-end
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Usuarios eliminados correctamente',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true
        });
        // limpiar textarea
        this.usuariosLote = '';
      }
    });
  }

}
