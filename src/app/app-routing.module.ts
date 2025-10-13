import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BaseComponent } from './views/layout/base/base.component';
import { AuthGuard } from './core/guard/auth.guard';
import { ErrorPageComponent } from './views/pages/error-page/error-page.component';
import { UsuariosComponent } from './views/sepa/seguridad/usuarios/usuarios.component';
import { UsuariosResolver } from './core/resolvers/usuarios.resolver';

const routes: Routes = [
  { path:'auth', loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule) },
  {
    path: '',
    component: BaseComponent,
    canActivate: [],
    children: [
      {
        path: 'inicio',
        loadChildren: () => import('./views/sepa/inicio/inicio.module').then(m => m.InicioModule)
      },
      {
        path: 'dashboard',
        loadChildren: () => import('./features/example/example.module').then(m => m.ExampleModule)
      },

      {
        path: 'seguridad', 
        loadChildren: () => import('./views/sepa/seguridad/seguridad.module').then(m => m.SeguridadModule)
      },

      {
        path: 'operaciones',
        loadChildren: () => import('./views/sepa/operaciones/operaciones.module').then(m => m.OperacionesModule)
      },

      {
        path: 'configuracion',
        loadChildren: () => import ('./views/sepa/configuracion/configuracion.module').then(m => m.ConfiguracionModule)
      },
      {
        path: 'reportes',
        loadChildren: () => import ('./views/sepa/reportes/reportes.module').then(m => m.ReportesModule)
      },
      {
        path: 'auditoria',
        loadChildren: () => import ('./views/sepa/auditoria/auditoria.module').then(m => m.AuditoriaModule)
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
