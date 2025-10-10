import { Component, OnInit } from '@angular/core';


@Component({
  selector: 'app-programador-tareas',
  templateUrl: './programador-tareas.component.html',
  styleUrls: ['./programador-tareas.component.scss']
})
export class ProgramadorTareasComponent implements OnInit {

  diasSemana: string[] = [
    'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'
  ];
  diaSeleccionado: string = 'Lunes';

  horaMinutoSeleccionada = { hour: 0, minute: 0 };
  horaDesde = { hour: 0, minute: 0 };
  horaHasta = { hour: 23, minute: 59 };
  minutoSeleccionado: number = 0;
  activoSeleccionado: boolean = true;

  constructor() { }

  ngOnInit(): void {
  }

  procesar() {
    console.log({
      tarea: 'MantenimientoLogInfi',
      dia: this.diaSeleccionado,
      horaMinuto: this.horaMinutoSeleccionada,
      horaDesde: this.horaDesde,
      horaHasta: this.horaHasta,
      minuto: this.minutoSeleccionado,
      activo: this.activoSeleccionado
    });
  }

  salir() {

  }
}
