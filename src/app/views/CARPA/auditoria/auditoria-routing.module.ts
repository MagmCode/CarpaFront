import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TrazasComponent } from './trazas/trazas.component';
import { SeguimientoComponent } from './seguimiento/seguimiento.component';

const routes: Routes = [
  {
    path: 'trazas', component: TrazasComponent
  },
  {
    path: 'seguimiento', component: SeguimientoComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuditoriaRoutingModule { }
