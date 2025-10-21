import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GenericTableComponent } from './components/generic-table/generic-table.component';
import { GenericModalComponent } from './components/generic-modal/generic-modal.component';
import { GenericFormComponent } from './components/generic-form/generic-form.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap'; // Importa el módulo del datepicker
import { LocalLoadingComponent } from './components/local-loading/local-loading.component';


@NgModule({
  declarations: [
    GenericTableComponent,
    GenericModalComponent,
    GenericFormComponent,
    LocalLoadingComponent
  ],
  imports: [CommonModule, ReactiveFormsModule,NgbDatepickerModule,FormsModule],
  exports: [
    
    GenericTableComponent,
    GenericModalComponent,
    GenericFormComponent,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbDatepickerModule,
    LocalLoadingComponent
  ],
})
export class SharedModule {}
