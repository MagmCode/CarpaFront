import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import * as feather from 'feather-icons';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RestService } from 'src/app/core/services/rest.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-example',
  templateUrl: './example.component.html',
  styleUrls: ['./example.component.scss']
})
export class ExampleComponent implements OnInit, AfterViewInit {
  @ViewChild('createEmpleadoModal') createEmpleadoModal: any;
  @ViewChild('editEmpleadoModal') editEmpleadoModal: any;

  page = 1;
  empleados: any[] = [];
  loading = false;
  selectedOperacion: any = null; 
  showTables = false;
  fieldsEditar: any[] = [];

  fields: any[] = [
    {
      name: 'nombre',
      label: 'Nombre Empleado',
      type: 'text',
      placeholder: 'Ingrese Nombre del Empleado',
      validations: [],
    },
    {
      name: 'cedula',
      label: 'Cedula',
      type: 'text',
      placeholder: 'Ingrese Numero de Cedula',
      validations: [],
    },
    {
      name: 'estatus',
      label: 'Estatus',
      type: 'select',
      options: [
        { value: '2', label: 'Activo' },
        { value: '3', label: 'Inactivo' }
      ],
      validations: [],
    },
  ];

  fieldsCrear: any[] = [
    {
      name: 'nombre',
      label: 'Nombre Empleado',
      type: 'text',
      placeholder: 'Ingrese Nombre del Empleado',
      validations: [],
    },
    {
      name: 'apellido',
      label: 'Apellido Empleado',
      type: 'text',
      placeholder: 'Ingrese Apellido del Empleado',
      validations: [],
    },
    {
      name: 'cedRif',
      label: 'Cedula',
      type: 'text',
      placeholder: 'Ingrese Numero de Cedula',
      validations: [],
    },
    {
      name: 'nroTelefono',
      label: 'Nro. Telefono',
      type: 'text',
      placeholder: 'Ingrese Numero de Telefono',
      validations: [],
    },
    {
      name: 'email',
      label: 'Correo',
      type: 'text',
      placeholder: 'Ingrese Correo Electronico',
      validations: [],
    },
    {
      name: 'salario',
      label: 'Sueldo',
      type: 'text',
      placeholder: 'Ingrese Sueldo',
      validations: [],
    },
    {
      name: 'cargo',
      label: 'Cargo',
      type: 'text',
      placeholder: 'Ingrese Cargo',
      validations: [],
    },
    {
      name: 'fechaIngreso',
      label: 'Fecha Ingreso',
      type: 'text',
      placeholder: 'Fecha Ingreso',
      validations: [],
    },
    {
      name: 'fechaNac',
      label: 'Fecha Nacimiento',
      type: 'text',
      placeholder: 'Fecha Nacimiento',
      validations: [],
    },
    {
      name: 'estatus',
      label: 'Estatus',
      type: 'select',
      options: [
        { value: '2', label: 'Activo' },
        { value: '3', label: 'Inactivo' }
      ],
      validations: [],
    }
  ];

  layoutCrear: any[] = [
    'col-sm-4',
    'col-sm-4',
    'col-sm-4',
    'col-sm-4',
    'col-sm-4',
    'col-sm-4',
    'col-sm-4',
    'col-sm-4',
    'col-sm-4',
    'col-sm-4',
  ];

  layoutEditar: any[] = [
    'col-sm-4',
    'col-sm-4',
    'col-sm-4',
    'col-sm-4',
    'col-sm-4',
    'col-sm-4',
    'col-sm-4',
    'col-sm-4',
    'col-sm-4',
    'col-sm-4',
  ];

  additionalButtons = [
    {
      label: 'Crear',
      action: () => this.opencreateEmpleadoModal(),
      icon: 'feather icon-save',
      class: 'btn-success'
    }
  ];
  constructor(
    private formBuilder: FormBuilder,
    private restService: RestService, 
    private modalService: NgbModal,
    private router: Router,
  ) {}

  ngOnInit(): void {

    const reqempleados = {
      id: '',
      nombre: '',
      apellido: '',
      cedula: ''
    };
  //  this.obtenerempleados(reqempleados);
  }

  ngAfterViewInit(): void {
    feather.replace();
  }

  obtenerempleados(formValue: any): void {
    this.empleados = [];
    this.loading = true;
    const reqempleados = {
      id: formValue.id,
      nombre: formValue.nombre,
      estatus: formValue.estatus,
      apellido: formValue.descripcion,
      cedula: formValue.cedula,
      telefono: formValue.telefono,
      email: formValue.email,
      salario: formValue.salario,
      cargo: formValue.cargo,
      fechaIngreso: formValue.fechaIngreso,
      fechaNacimiento: formValue.fechaNacimiento,
    };
  
    this.restService.post(
      `/api/stockManager/empleados/buscar`,
      reqempleados
    ).subscribe((res: any) => {
      this.empleados = res.empleados;
      this.empleados = this.empleados.map((empleado:any) => ({
        ...empleado,
         }));
      this.showTables = true;
      this.loading = false;
      console.log('empleados: ', this.empleados);
    }, (error: any) => {
      this.showTables = true;
      this.loading = false;
      console.error('Error al obtener empleados:', error);      
    });
  }

  onSubmit(formValue: any) {
    this.obtenerempleados(formValue);
  }

  edit(operacion: any) {
    this.selectedOperacion = operacion;
    console.log('Editar Empleado:', operacion);
    this.fieldsEditar = [
      {
        name: 'nombre',
        label: 'Nombre Empleado',
        type: 'text',
        placeholder: 'Ingrese Nombre del Empleado',
        validations: [],
        value: operacion.nombre
      },
      {
        name: 'apellido',
        label: 'Apellido Empleado',
        type: 'text',
        placeholder: 'Ingrese Apellido del Empleado',
        validations: [],
        value: operacion.apellido
      },
      {
        name: 'cedRif',
        label: 'Cedula',
        type: 'text',
        placeholder: 'Ingrese Numero de Cedula',
        validations: [],
        value: operacion.cedRif
      },
      {
        name: 'nroTelefono',
        label: 'Nro. Telefono',
        type: 'text',
        placeholder: 'Ingrese Numero de Telefono',
        validations: [],
        value: operacion.nroTelefono
      },
      {
        name: 'email',
        label: 'Correo',
        type: 'text',
        placeholder: 'Ingrese Correo Electronico',
        validations: [],
        value: operacion.email
      },
      {
        name: 'salario',
        label: 'Sueldo',
        type: 'text',
        placeholder: 'Ingrese Sueldo',
        validations: [],
        value: operacion.salario
      },
      {
        name: 'cargo',
        label: 'Cargo',
        type: 'text',
        placeholder: 'Ingrese Cargo',
        validations: [],
        value: operacion.cargo
      },
      {
        name: 'fechaIngreso',
        label: 'Fecha Ingreso',
        type: 'text',
        placeholder: 'Fecha Ingreso',
        validations: [],
        value: operacion.fechaIngreso
      },
      {
        name: 'fechaNac',
        label: 'Fecha Nacimiento',
        type: 'text',
        placeholder: 'Fecha Nacimiento',
        validations: [],
        value: operacion.fechaNac
      }, 
      ,
      {
        name: 'comision',
        label: 'Porcentaje Comision',
        type: 'text',
        placeholder: 'Porcentaje Comision',
        validations: [],
        value: operacion.comision
      }, 
      {
        name: 'estatus',
        label: 'Estatus',
        type: 'select',
        options: [
          { value: '2', label: 'Activo' },
          { value: '3', label: 'Inactivo' }
        ],
        validations: [],
        value: operacion.estatus
      }
    ];
    this.modalService.open(this.editEmpleadoModal);
  }

  eliminar(operacion: any) {
    const reqempleados = {
      id: operacion.id,
      nombre: '',
      estatus: '',
      apellido: ''
    };
  
    this.restService.post(
      `/api/stockManager/empleados/eliminar`,
      reqempleados
    ).subscribe((res: any) => {
      console.log('empleados: ', res.codigo);
    }, (error: any) => {
      console.error('Error al obtener empleados:', error);      
    });

    console.log('eliminar Empleado:', operacion);
    this.reload();
  }

  opencreateEmpleadoModal() {
    this.modalService.open(this.createEmpleadoModal);
  }

  closecreateEmpleadoModal(modal: any) {
    modal.close();
  }

  savecreateEmpleadoModal(formValue: any) {
    console.log('formValue: ', formValue);
    const reqempleados = {
      id: formValue.id,
      nombre: formValue.nombre,
      estatus: formValue.estatus,
      apellido: formValue.apellido,
      cedRif: formValue.cedRif,
      nroTelefono: formValue.nroTelefono,
      email: formValue.email,
      salario: formValue.salario,
      cargo: formValue.cargo,
      fechaIngreso: formValue.fechaIngreso,
      fechaNac: formValue.fechaNac,
    };
    this.restService.post(
      `/api/stockManager/empleados/actualizar`,
      reqempleados
    ).subscribe((res: any) => {
      console.log('empleados: ', res.codigo);
      this.modalService.dismissAll();
    }, (error: any) => {
      console.error('Error al crear Empleado:', error);      
    });
    this.reload();
  }

  closeeditEmpleadoModal(modal: any) {
    modal.close();
  }

  saveeditEmpleadoModal(formValue: any) {
    const reqempleados = {
      id: this.selectedOperacion.id,
      nombre: formValue.nombre,
      estatus: formValue.estatus,
      apellido: formValue.apellido,
      cedRif: formValue.cedRif,
      nroTelefono: formValue.nroTelefono,
      email: formValue.email,
      salario: formValue.salario,
      cargo: formValue.cargo,
      fechaIngreso: formValue.fechaIngreso,
      fechaNac: formValue.fechaNac,
    };
    console.log('reqempleados: ', reqempleados);
    this.restService.post(
      `/api/stockManager/empleados/actualizar`,
      reqempleados
    ).subscribe((res: any) => {
      console.log('empleados: ', res.codigo);
      this.modalService.dismissAll();
    }, (error: any) => {
      console.error('Error al actualizar Empleado:', error);      
    });
    this.reload();
  }

  reload() {
    const currentUrl = this.router.url;
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.router.onSameUrlNavigation = 'reload';
    this.router.navigate([currentUrl]);
  }

  mostrarComision(empleado : any) {
    const reqempleados = {
      id: empleado.id,
      nombre: '',
      estatus: '',
      apellido: ''
    };
  
    this.restService.post(
      `/api/stockManager/empleados/comision`,
      reqempleados
    ).subscribe({
        next: (data) => {
          Swal.fire({
            title: 'Comisión del Empleado',
            text: `El monto de comisión es: ${data.comision}`,
            icon: 'info',
            confirmButtonText: 'Aceptar',
          });
        },
        error: (err) => {
          Swal.fire({
            title: 'Error',
            text: err.error.message || 'No se pudo calcular la comisión.',
            icon: 'error',
            confirmButtonText: 'Aceptar',
          });
        },
      });
  }

}