import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OperacionesRoutingModule } from './operaciones-routing.module';
import { ConsultasHilosAbiertosComponent } from './consultas-hilos-abiertos/consultas-hilos-abiertos.component';


@NgModule({
  declarations: [
    ConsultasHilosAbiertosComponent
  ],
  imports: [
    CommonModule,
    OperacionesRoutingModule
  ]
})
export class OperacionesModule { }
