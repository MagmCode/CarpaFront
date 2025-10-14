import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdministradorRoutingModule } from './administrador-routing.module';
import { EquiposComponent } from './equipos/equipos.component';
import { DriversComponent } from './drivers/drivers.component';


@NgModule({
  declarations: [
    EquiposComponent,
    DriversComponent
  ],
  imports: [
    CommonModule,
    AdministradorRoutingModule
  ]
})
export class AdministradorModule { }
