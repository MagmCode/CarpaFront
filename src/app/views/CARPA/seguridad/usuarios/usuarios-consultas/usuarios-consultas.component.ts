import { Component, OnInit, TemplateRef } from '@angular/core';
import { AplicacionesService, Aplicacion } from 'src/app/services/aplicaciones-services/aplicaciones.service';  
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';

interface Usuario {
  userId: string;
  nombre: string;
  apellido: string;
  email: string;
  estatus: 'activo' | 'inactivo';
  roles: RolUsuario[];
}

interface RolUsuario {
  id: number;
  alias: string;
  descripcion: string;
  tipo: string;
  aplicacion: string;
  seleccionado?: boolean;
}

@Component({
  selector: 'app-usuarios-consultas',
  templateUrl: './usuarios-consultas.component.html',
  styleUrls: ['./usuarios-consultas.component.scss']
})
export class UsuariosConsultasComponent implements OnInit {

  aplicaciones: Aplicacion[] = [];

  usuarios: Usuario[] = [
        {
      userId: 'u001',
      nombre: 'Juan',
      apellido: 'Pérez',
      email: 'juan.perez@email.com',
      estatus: 'activo',
      roles: [
        { id: 1, alias: 'ADMIN', descripcion: 'Administrador', tipo: 'Usuarios de la Torre', aplicacion: 'Gestión Usuarios' },
        { id: 2, alias: 'INV', descripcion: 'Inventario', tipo: 'Usuarios de Red Comercial', aplicacion: 'Inventario' }
      ]
    },
    {
      userId: 'u002',
      nombre: 'Ana',
      apellido: 'García',
      email: 'ana.garcia@email.com',
      estatus: 'inactivo',
      roles: [
        { id: 3, alias: 'USER', descripcion: 'Usuario básico', tipo: 'Usuarios de la Torre', aplicacion: 'Gestión Usuarios' }
      ]
    }  
  ];

  usuarioSeleccionado:Usuario | null = null;

  rolesDisponibles: RolUsuario[] = [
    { id: 1, alias: 'ADMIN', descripcion: 'Administrador', tipo: 'Usuarios de la Torre', aplicacion: 'Gestión Usuarios' },
    { id: 2, alias: 'INV', descripcion: 'Inventario', tipo: 'Usuarios de Red Comercial', aplicacion: 'Inventario' },
    { id: 3, alias: 'USER', descripcion: 'Usuario básico', tipo: 'Usuarios de la Torre', aplicacion: 'Gestión Usuarios' }
  ];

  constructor(
    private aplicacionesService: AplicacionesService,
    private modalService: NgbModal,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.aplicaciones = this.aplicacionesService.getAplicaciones();
  }

  openEliminarModal(usuario: Usuario, TemplateRef: TemplateRef<any>) {
    this.usuarioSeleccionado = usuario;
    this.modalService.open(TemplateRef, { centered: true });
  }

  openEditarModal(usuario: Usuario, TemplateRef: TemplateRef<any>) {
    this.usuarioSeleccionado = {...usuario};
    this.modalService.open(TemplateRef, { centered: true});
  }

  openEditarRolesModal(usuario: Usuario, TemplateRef: TemplateRef<any>) {
    this.usuarioSeleccionado = usuario;
    this.modalService.open(TemplateRef, { centered: true });
  }

  openAsociarRolesModal(usuario: Usuario, TemplateRef: TemplateRef<any>) {
    this.usuarioSeleccionado = usuario;
    this.rolesDisponibles.forEach(r => {
      r.seleccionado = !!usuario.roles.find(ur => ur.id ===r.id);
    });
    this.modalService.open(TemplateRef, { centered: true });
  }

  eliminarUsuario(usuario: Usuario, modal: any) {
    this.usuarios = this.usuarios.filter(u => u.userId !== usuario.userId);
    modal.close();
  }

  guardarEdicionUsuario(modal: any) {
    if (this.usuarioSeleccionado) {
      const idx = this.usuarios.findIndex(u => u.userId === this.usuarioSeleccionado!.userId);
      if (idx !== -1) {
        this.usuarios[idx] = { ...this.usuarioSeleccionado };
      }
    }
    modal.close();
  }

  guardarAsociacionRoles(usuario: Usuario, modal: any) {
    const rolesSeleccionados = this.rolesDisponibles.filter(r => r.seleccionado);

    const idx = this.usuarios.findIndex(u => u.userId === usuario.userId);
    if (idx !== -1) {
      this.usuarios[idx].roles = rolesSeleccionados.map(r => ({
        id: r.id,
        alias: r.alias,
        descripcion: r.descripcion,
        tipo: r.tipo,
        aplicacion: r.aplicacion
      }));
    }
    this.rolesDisponibles.forEach(r => r.seleccionado = false);
    modal.close();
  }

  regresar() {
    this.router.navigate(['/seguridad/usuarios']);
  }
}
