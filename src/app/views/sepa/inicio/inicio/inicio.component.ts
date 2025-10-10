import { AfterViewInit, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as feather from 'feather-icons';

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.scss']
})
export class InicioComponent implements OnInit, AfterViewInit {
  showConsultas = false;
  showSeguridad = false;
  showOperaciones = false;
  showConfiguracion = false;
  usuario = 'Gabriel Terán'

seguridadItems = [
    { label: 'Aplicaciones', route: '/seguridad/aplicaciones' },
    { label: 'Opciones del Menú', route: '/seguridad/opciones-de-menu' },
    { label: 'Acciones', route: '/seguridad/acciones' },
    { label: 'Roles', route: '/seguridad/roles' },
    { label: 'Roles - Acciones', route: '/seguridad/roles-acciones' },
    { label: 'Roles - Menú', route: '/seguridad/roles-menu' },
    { label: 'Usuarios', route: '/seguridad/usuarios' },
    { label: 'Parámetros', route: '/seguridad/parametros-sistema' },
    { label: 'Agregar Usuarios en lote', route: '/seguridad/agregar-usuarios' },
    { label: 'Eliminar Usuarios en lote', route: '/seguridad/eliminar-usuarios' },
    { label: 'Programador de Tareas (SHEDULER)', route: '/seguridad/programador-tareas' }
  ];

    operacionesItems = [
    { label: 'Consultas Hilos Abiertos', route: '/operaciones/consultas-hilos-abiertos' }
    // Agrega más componentes de operaciones aquí
  ];

  configuracionItems = [
    { label: 'Servicios Web BCV', route: '/configuracion/servicios-web-bcv' }
    // Agrega más componentes de configuración aquí
  ];

  constructor(private router: Router) { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    feather.replace();
  }

  navigate(route: string): void {
    this.router.navigate([route]);
  }

  navigateAndClose(route:string): void {
    this.showConsultas = false;
    this.router.navigate([route]);
  }

  navigateAndCloseSeguridad(route:string): void {
    this.showSeguridad = false;
    this.router.navigate([route]);
  }

    navigateAndCloseOperaciones(route:string): void {
    this.showOperaciones = false;
    this.router.navigate([route]);
  }

    navigateAndCloseConfiguracion(route:string): void {
    this.showConfiguracion = false;
    this.router.navigate([route]);
  }

}
