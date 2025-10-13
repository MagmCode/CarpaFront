import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReportesAplicacionComponent } from './reportes-aplicacion/reportes-aplicacion.component';

const routes: Routes = [
  {
    path: 'aplicaciones', component: ReportesAplicacionComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportesRoutingModule { }
