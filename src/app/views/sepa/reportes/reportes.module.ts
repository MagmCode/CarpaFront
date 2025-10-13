import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReportesRoutingModule } from './reportes-routing.module';
import { ReportesAplicacionComponent } from './reportes-aplicacion/reportes-aplicacion.component';
import { SharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    ReportesAplicacionComponent
  ],
  imports: [
    CommonModule,
    ReportesRoutingModule,
    SharedModule
  ]
})
export class ReportesModule { }
