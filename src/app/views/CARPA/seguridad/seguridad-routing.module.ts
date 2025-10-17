import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AplicacionesComponent } from './aplicaciones/aplicaciones.component';
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
import { RolesConsultasComponent } from './roles/roles-consultas/roles-consultas.component';
import { AccionesBuscarComponent } from './acciones/acciones-buscar/acciones-buscar.component';
import { RolesAccionesConsultasComponent } from './roles-acciones/roles-acciones-consultas/roles-acciones-consultas.component';
import { RolesMenuConsultasComponent } from './roles-menu/roles-menu-consultas/roles-menu-consultas.component';
import { UsuariosConsultasComponent } from './usuarios/usuarios-consultas/usuarios-consultas.component';

const routes: Routes = [
  {
    path: 'aplicaciones', component: AplicacionesComponent
  },
  {
    path: 'opciones-menu', component: OpcionesDeMenuComponent
  },
  {
    path: 'privilegios', component: AccionesComponent 
  },
  {
    path: 'acciones/buscar', component: AccionesBuscarComponent
  },
  {
    path: 'roles', component: RolesComponent
  },
  {
    path: 'roles/consultas', component: RolesConsultasComponent
  },
  {
    path: 'roles-privilegios', component: RolesAccionesComponent
  },
  {
    path: 'roles-privilegios/consultas', component: RolesAccionesConsultasComponent
  },
  {
    path: 'roles-menu', component: RolesMenuComponent
  },
  {
    path: 'roles-menu/consultas', component: RolesMenuConsultasComponent
  },
  {
    path: 'usuarios', component: UsuariosComponent
  },
  {
    path: 'usuarios/consultas', component: UsuariosConsultasComponent
  },
  {
    path: 'parametros-sistema', component: ParametrosSistemaComponent
  },
  {
    path: 'agregar-usuarios', component: AgregarUsuariosComponent
  },
  {
    path: 'eliminar-usuarios', component: EliminarUsuariosComponent
  },
  {
    path: 'programador-tareas', component: ProgramadorTareasComponent
  },

{
  path: 'consultas/opciones-menu-por-rol', component: OpcionesMenuPorRolComponent
},
{
  path: 'consultas/opciones-menu-por-url', component: OpcionesMenuPorUrlComponent
},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SeguridadRoutingModule { }
