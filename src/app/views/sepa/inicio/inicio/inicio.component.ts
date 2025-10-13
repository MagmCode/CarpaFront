import { AfterViewInit, Component, OnInit } from '@angular/core';
import { MENU } from '../../../layout/sidebar/menu';
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
  showreportes = false;
  showConfiguracion = false;
  usuario: string | null = null;



seguridadItems: any[] = [];
reportesItems: any[] = [];
configuracionItems: any[] = [];

// Recursivo: convierte subItems a hijos planos o anidados según se requiera
private extractMenuItems(menu: any, label: string): any[] {
  const found = menu.find((item: any) => item.label === label);
  if (!found) return [];
  if (found.subItems) {
    return found.subItems.map((sub: any) => {
      if (sub.subItems) {
        return { ...sub, children: this.extractMenuItems([sub], sub.label) };
      }
      return { label: sub.label, route: sub.link };
    });
  }
  return [];
}

  constructor(private router: Router) { }

  ngOnInit(): void {
    this.usuario = localStorage.getItem('usuarioActual');
    this.seguridadItems = this.extractMenuItems(MENU, 'Seguridad');
    this.configuracionItems = this.extractMenuItems(MENU, 'Configuración');
    this.reportesItems = this.extractMenuItems(MENU, 'Reportes');
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

    navigateAndClosereportes(route:string): void {
    this.showreportes = false;
    this.router.navigate([route]);
  }

    navigateAndCloseConfiguracion(route:string): void {
    this.showConfiguracion = false;
    this.router.navigate([route]);
  }

}
