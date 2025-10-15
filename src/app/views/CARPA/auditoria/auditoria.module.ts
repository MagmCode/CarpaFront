import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuditoriaRoutingModule } from './auditoria-routing.module';
import { TrazasComponent } from './trazas/trazas.component';
import { SeguimientoComponent } from './seguimiento/seguimiento.component';
import { SharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    TrazasComponent,
    SeguimientoComponent
  ],
  imports: [
    CommonModule,
    AuditoriaRoutingModule,
    SharedModule
  ]
})
export class AuditoriaModule { }
