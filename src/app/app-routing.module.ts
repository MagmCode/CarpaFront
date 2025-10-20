import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BaseComponent } from './views/layout/base/base.component';
import { AuthGuard } from './core/guard/auth.guard';
import { ErrorPageComponent } from './views/pages/error-page/error-page.component';
import { UsuariosComponent } from './views/CARPA/seguridad/usuarios/usuarios.component';
import { UsuariosResolver } from './core/resolvers/usuarios.resolver';

const routes: Routes = [
  { path:'auth', loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule) },
  {
    path: '',
    component: BaseComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'inicio',
        loadChildren: () => import('./views/CARPA/inicio/inicio.module').then(m => m.InicioModule)
      },
      {
        path: 'dashboard',
        loadChildren: () => import('./features/example/example.module').then(m => m.ExampleModule)
      },

      {
        path: 'accesos', 
        loadChildren: () => import('./views/CARPA/seguridad/seguridad.module').then(m => m.SeguridadModule)
      },

      {
        path: 'operaciones',
        loadChildren: () => import('./views/CARPA/operaciones/operaciones.module').then(m => m.OperacionesModule)
      },

      {
        path: 'configuracion',
        loadChildren: () => import ('./views/CARPA/configuracion/configuracion.module').then(m => m.ConfiguracionModule)
      },
      {
        path: 'reportes',
        loadChildren: () => import ('./views/CARPA/reportes/reportes.module').then(m => m.ReportesModule)
      },
      {
        path: 'auditoria',
        loadChildren: () => import ('./views/CARPA/auditoria/auditoria.module').then(m => m.AuditoriaModule)
      },
      {
        path: 'administrador',
        loadChildren: () => import ('./views/CARPA/administrador/administrador.module').then(m => m.AdministradorModule)
      },
      
      { path: '', redirectTo: '/auth/login', pathMatch: 'full' }, 

        {
    path: 'seguridad/usuarios',
    component: UsuariosComponent,
    resolve: { usuarios: UsuariosResolver }
  }
      // { path: '**', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { 
    path: 'error',
    component: ErrorPageComponent,
    data: {
      'type': 404,
      'title': 'Page Not Found',
      'desc': 'Oopps!! The page you were looking for doesn\'t exist.'
    }
  },
  {
    path: 'error/:type',
    component: ErrorPageComponent
  },
  { path: '**', redirectTo: 'error', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'top' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
