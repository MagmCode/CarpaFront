import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ServiciosWebBcvComponent } from './servicios-web-bcv/servicios-web-bcv.component';

const routes: Routes = [
  {
    path: 'servicios-web-bcv', component: ServiciosWebBcvComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ConfiguracionRoutingModule { }
