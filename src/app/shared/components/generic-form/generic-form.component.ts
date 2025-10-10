import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ValidatorFn } from '@angular/forms';

@Component({
  selector: 'app-generic-form',
  templateUrl: './generic-form.component.html',
  styleUrls: ['./generic-form.component.scss'],
})
export class GenericFormComponent implements OnInit {
  @Input() fields: any[] = [];
  @Input() layout: any[] = [];
  @Input() submitLabel: string = 'Submit';
  @Input() submitClass: string = 'btn-primary'; // Clase CSS para el botón de envío
  @Input() submitIcon?: string; // Ícono opcional para el botón de envío
  @Input() showDropdown: boolean = false;
  @Input() additionalButtons: { label: string; action: () => void; icon?: string; class?: string }[] = [];
  @Input() showAdvancedButton: boolean = true;

  @Output() formSubmit = new EventEmitter<any>();
  @Output() exportClick = new EventEmitter<void>();
  @Output() uploadClick = new EventEmitter<void>();

  form: FormGroup;
  showAdvancedFilters = false;

  constructor(private formBuilder: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.formBuilder.group({});
    this.initializeForm();
  }

  initializeForm(): void {
    const today = new Date().toISOString().split('T')[0];
    this.fields.forEach((field) => {
      if (field.type === 'select' && !field.options) {
        field.options = [];
      }
      const control = this.formBuilder.control(
        field.type === 'date' && !field.value ? today : field.value || '',
        field.validations.map((v: { validator: ValidatorFn }) => v.validator)
      );
      this.form.addControl(field.name, control);
    });
  }

  onSubmit() {
    if (this.form.valid) {
      this.formSubmit.emit(this.form.value);
    } else {
      this.form.markAllAsTouched();
    }
  }

  resetForm() {
    this.form.reset();
  }

  toggleAdvancedFilters() {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  onExportClick() {
    this.exportClick.emit();
  }

  onUploadClick() {
    this.uploadClick.emit();
  }
}