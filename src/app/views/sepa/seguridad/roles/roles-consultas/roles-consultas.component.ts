import { Component, OnInit, AfterViewInit, TemplateRef } from '@angular/core';
import { DataTable } from "simple-datatables";
import { AplicacionesService, Aplicacion } from 'src/app/services/aplicaciones-services/aplicaciones.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

interface RolConsulta {
  rol: string;
  descripcion: string;
  tipo: string;
  aplicacion: string;
}

@Component({
  selector: 'app-roles-consultas',
  templateUrl: './roles-consultas.component.html',
  styleUrls: ['./roles-consultas.component.scss']
})
export class RolesConsultasComponent implements OnInit {

  roles: RolConsulta[] = [
    {
      rol: 'admin',
      descripcion: 'Administrador general',
      tipo: 'Usuarios de la Torre',
      aplicacion: 'Gestión Usuarios'
    },
    {
      rol: 'comercial',
      descripcion: 'Gestor comercial',
      tipo: 'Usuarios de Red Comercial',
      aplicacion: 'Inventario'
    },
        {
      rol: 'admin',
      descripcion: 'Administrador general',
      tipo: 'Usuarios de la Torre',
      aplicacion: 'Gestión Usuarios'
    },
    {
      rol: 'comercial',
      descripcion: 'Gestor comercial',
      tipo: 'Usuarios de Red Comercial',
      aplicacion: 'Inventario'
    },
        {
      rol: 'admin',
      descripcion: 'Administrador general',
      tipo: 'Usuarios de la Torre',
      aplicacion: 'Gestión Usuarios'
    },
    {
      rol: 'comercial',
      descripcion: 'Gestor comercial',
      tipo: 'Usuarios de Red Comercial',
      aplicacion: 'Inventario'
    },
        {
      rol: 'admin',
      descripcion: 'Administrador general',
      tipo: 'Usuarios de la Torre',
      aplicacion: 'Gestión Usuarios'
    },
    {
      rol: 'comercial',
      descripcion: 'Gestor comercial',
      tipo: 'Usuarios de Red Comercial',
      aplicacion: 'Inventario'
    },
        {
      rol: 'admin',
      descripcion: 'Administrador general',
      tipo: 'Usuarios de la Torre',
      aplicacion: 'Gestión Usuarios'
    },
    {
      rol: 'comercial',
      descripcion: 'Gestor comercial',
      tipo: 'Usuarios de Red Comercial',
      aplicacion: 'Inventario'
    },
        {
      rol: 'admin',
      descripcion: 'Administrador general',
      tipo: 'Usuarios de la Torre',
      aplicacion: 'Gestión Usuarios'
    },
    {
      rol: 'comercial',
      descripcion: 'Gestor comercial',
      tipo: 'Usuarios de Red Comercial',
      aplicacion: 'Inventario'
    },
        {
      rol: 'admin',
      descripcion: 'Administrador general',
      tipo: 'Usuarios de la Torre',
      aplicacion: 'Gestión Usuarios'
    },
    {
      rol: 'comercial',
      descripcion: 'Gestor comercial',
      tipo: 'Usuarios de Red Comercial',
      aplicacion: 'Inventario'
    },
  ];

  aplicaciones: Aplicacion[] = [];
  newRole: RolConsulta = {rol: '', descripcion: '', tipo: '', aplicacion: ''};

  constructor(
    private aplicacionesService: AplicacionesService,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    this.aplicaciones = this.aplicacionesService.getAplicaciones();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      new DataTable("#rolesConsultaTable");
    }, 0);
  }

  openAddRoleModal(content: TemplateRef<any>) {
    this.newRole = { rol: '', descripcion:'', tipo: '', aplicacion: '' };
    this.modalService.open(content, { centered: true });
  }

  addRole(modal: any) {
    this.roles.push({ ...this.newRole });
    modal.close();
    setTimeout(() => {
      new DataTable("#rolesConsultaTable");
    }, 0);
  }
}
