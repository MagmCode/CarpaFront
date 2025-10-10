import { Component, OnInit } from '@angular/core';
import { AplicacionesService, Aplicacion } from 'src/app/services/aplicaciones-services/aplicaciones.service';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

interface NuevoRol {
  rol: string;
  descripcion: string;
  tipo: string;
  aplicacion: string;
}

@Component({
  selector: 'app-roles-menu',
  templateUrl: './roles-menu.component.html',
  styleUrls: ['./roles-menu.component.scss']
})
export class RolesMenuComponent implements OnInit {
  
  alias: string = '';
  uso: string = '';
  aplicacion: string = '';
  aplicaciones: Aplicacion[] = [];

  newRole: NuevoRol = { rol: '', descripcion: '', tipo: '', aplicacion: '' };

  constructor(
    private aplicacionesService: AplicacionesService,
    private router: Router,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    this.aplicaciones = this.aplicacionesService.getAplicaciones();
  }

  openAddRoleModal(content: any) {
    this.newRole = {rol: '', descripcion: '', tipo: '', aplicacion: ''};
    this.modalService.open(content, { centered: true });
  }

  addRole(modal: any) {
    modal.close();
  }

  consultar() {
    this.router.navigate(['/seguridad/roles-menu/consultas']);
    console.log('Consultar:', this.alias, this.uso, this.aplicacion);
  }
  
  salir() {
    console.log('Salir');
  }
}