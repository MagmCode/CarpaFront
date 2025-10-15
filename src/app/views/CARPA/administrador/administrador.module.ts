import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdministradorRoutingModule } from './administrador-routing.module';
import { EquiposComponent } from './equipos/equipos.component';
import { DriversComponent } from './drivers/drivers.component';
import { SharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    EquiposComponent,
    DriversComponent
  ],
  imports: [
    CommonModule,
    AdministradorRoutingModule,
    SharedModule
  ]
})
export class AdministradorModule { }
