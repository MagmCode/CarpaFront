import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiciosWebBcvComponent } from './servicios-web-bcv/servicios-web-bcv.component';
import { ConfiguracionRoutingModule } from './configuracion-routing.module';


@NgModule({
  declarations: [
    ServiciosWebBcvComponent,
  ],
  imports: [
    CommonModule,
    ConfiguracionRoutingModule,
    FormsModule,
  ]
})
export class ConfiguracionModule { }
