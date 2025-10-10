import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ConsultasHilosAbiertosComponent } from './consultas-hilos-abiertos/consultas-hilos-abiertos.component';

const routes: Routes = [
  {
    path: 'consultas-hilos-abiertos', component: ConsultasHilosAbiertosComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OperacionesRoutingModule { }
