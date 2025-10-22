import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ServiciosWebBcvComponent } from './servicios-web-bcv/servicios-web-bcv.component';
import { ParametrosSistemaComponent } from '../seguridad/parametros-sistema/parametros-sistema.component';

const routes: Routes = [
  {
    path: 'conexiones', component: ServiciosWebBcvComponent
  },
  {
    path: 'criterios', component: ParametrosSistemaComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ConfiguracionRoutingModule { }
