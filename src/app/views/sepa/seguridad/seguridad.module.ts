import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SeguridadRoutingModule } from './seguridad-routing.module';
import { OpcionesDeMenuComponent } from './opciones-de-menu/opciones-de-menu.component';
import { AccionesComponent } from './acciones/acciones.component';
import { RolesComponent } from './roles/roles.component';
import { RolesAccionesComponent } from './roles-acciones/roles-acciones.component';
import { RolesMenuComponent } from './roles-menu/roles-menu.component';
import { UsuariosComponent } from './usuarios/usuarios.component';
import { ParametrosSistemaComponent } from './parametros-sistema/parametros-sistema.component';
import { AgregarUsuariosComponent } from './agregar-usuarios/agregar-usuarios.component';
import { EliminarUsuariosComponent } from './eliminar-usuarios/eliminar-usuarios.component';
import { ProgramadorTareasComponent } from './programador-tareas/programador-tareas.component';
import { OpcionesMenuPorRolComponent } from './consultas/opciones-menu-por-rol/opciones-menu-por-rol.component';
import { OpcionesMenuPorUrlComponent } from './consultas/opciones-menu-por-url/opciones-menu-por-url.component';
import { AplicacionesComponent } from './aplicaciones/aplicaciones.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { RolesConsultasComponent } from './roles/roles-consultas/roles-consultas.component';
import { AccionesBuscarComponent } from './acciones/acciones-buscar/acciones-buscar.component';
import { RolesAccionesConsultasComponent } from './roles-acciones/roles-acciones-consultas/roles-acciones-consultas.component';
import { RolesMenuConsultasComponent } from './roles-menu/roles-menu-consultas/roles-menu-consultas.component';
import { UsuariosConsultasComponent } from './usuarios/usuarios-consultas/usuarios-consultas.component';
import { NgbTimepickerModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  declarations: [
    AplicacionesComponent,
    OpcionesDeMenuComponent,
    AccionesComponent,
    RolesComponent,
    RolesAccionesComponent,
    RolesMenuComponent,
    UsuariosComponent,
    ParametrosSistemaComponent,
    AgregarUsuariosComponent,
    EliminarUsuariosComponent,
    ProgramadorTareasComponent,
    OpcionesMenuPorRolComponent,
    OpcionesMenuPorUrlComponent,
    RolesConsultasComponent,
    AccionesBuscarComponent,
    RolesAccionesConsultasComponent,
    RolesMenuConsultasComponent,
    UsuariosConsultasComponent
  ],
  imports: [
    NgbTimepickerModule,
    CommonModule,
    SeguridadRoutingModule,
    SharedModule
  ]
})
export class SeguridadModule { }
