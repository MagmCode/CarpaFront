import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EquiposComponent } from './equipos/equipos.component';
import { DriversComponent } from './drivers/drivers.component';

const routes: Routes = [

  {
     path: 'conexiones',
     children: [
  {
    path: 'equipos', component: EquiposComponent 
  },
  {
    path: 'drivers', component: DriversComponent
  }
  ],
}
  
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdministradorRoutingModule { }
