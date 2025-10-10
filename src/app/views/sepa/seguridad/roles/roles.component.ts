import { Component, OnInit, TemplateRef, AfterViewInit } from '@angular/core';
import { DataTable } from 'simple-datatables';
import { AplicacionesService, Aplicacion } from 'src/app/services/aplicaciones-services/aplicaciones.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RolesService } from 'src/app/services/roles/roles.service';
import { Router, NavigationEnd } from '@angular/router';

interface NuevoRol {
  rol: string;
  descripcion: string;
  tipo: string;
  aplicacion: string;
}

interface RolConsulta {
  rol: string;
  descripcion: string;
  tipo: string;
  aplicacion: string;
}
// interface RolConsulta {
//   mscRoleId: number;
//   roleName: string;
//   description: string;
//   inUsoEnRed: string;
//   idApplication: string;
//   aplicaciones: string;
// }

@Component({
  selector: 'app-roles',
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.scss']
})
export class RolesComponent implements OnInit, AfterViewInit {

  mscRoleId: number = 0;
  roleName: string = '';
  description: string = '';
  inUsoEnRed: string = '';
  idApplication: string = '';
  aplicaciones: Aplicacion[] = [];

  newRole: NuevoRol = { rol: '...', descripcion: '...', tipo: '...', aplicacion: '...' };

  roles: RolConsulta[] = [];

  private dataTable: any;

  constructor(
    private aplicacionesService: AplicacionesService,
    private modalService: NgbModal,
    private rolesService: RolesService,
    private router: Router
  ) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd && event.url.includes('/roles')) {
        this.cargarRolesDesdeBackend();
      }
    });
   }

  ngOnInit(): void {
    this.aplicaciones = this.aplicacionesService.getAplicaciones();
    
    // this.cargarRolesDesdeLocalStorage();
    // this.cargarRoles();
    this.cargarRolesDesdeBackend();

  //   this.rolesService.roles$.subscribe((roles) => {
  //     if (roles && roles.length > 0) {
  //   this.roles = this.mapBackendRoles(roles); 
  //   console.log('roles[]',roles)
  //   setTimeout(() => {
  //     if (this.dataTable) {
  //       this.dataTable.destroy();
  //     }
  //     this.dataTable = new DataTable("#rolesConsultaTable");
  //   }, 0);
  // }
  // });

  }

  private mapBackendRoles(backendRoles: any[]): RolConsulta[] {
  return backendRoles.map(r => ({
    rol: r.roleName ?? '',
    descripcion: r.description ?? '',
    tipo: r.inUsoEnRed === 0 ? 'Interno' : 'Red Comercial',
    aplicacion: r.siglasApplic ?? ''
  }));
}

cargarRolesDesdeBackend() {
  const LOCAL_KEY = 'rolesConsultados';
  const rolesGuardados = localStorage.getItem(LOCAL_KEY);
  // console.log('rolesGuardados:', rolesGuardados);
  if (rolesGuardados) {
    const backendRoles = JSON.parse(rolesGuardados);
    this.roles = this.mapBackendRoles(backendRoles);
    setTimeout(() => {
      if (this.dataTable) {
        this.dataTable.destroy();
      }
      this.dataTable = new DataTable("#rolesConsultaTable");
    }, 0);
  }
}

  // cargarRolesDesdeLocalStorage() {
  //   const LOCAL_KEY = 'rolesConsultados';
  //   const rolesGuardados = localStorage.getItem (LOCAL_KEY);
  //   if (rolesGuardados) {
  //     this.roles = JSON.parse(rolesGuardados);
  //     setTimeout(() => {
  //       if (this.dataTable) {
  //         this.dataTable.destroy();
  //       }
  //       this.dataTable = new DataTable("#rolesConsultaTable");
  //     }, 0);
  //   }
  // }

  // cargarRoles() {
  //     this.rolesService.consultarRoles().subscribe({
  //     next: (data) => {
  //       this.roles = Array.isArray(data) ? data : (data.roles ?? []);
  //       setTimeout(() => {
  //         if (this.dataTable) {
  //           this.dataTable.destroy();
  //         }
  //         this.dataTable = new DataTable("#rolesConsultaTable");
  //       }, 0);
  //     },
  //     error: (err) => {
  //       this.roles = [];
  //       console.log("error");
  //     }
  //   });
  // }

  // cargarRolesDesdeLocalStorage() {
  // const LOCAL_KEY = 'rolesConsultados';
  // const rolesGuardados = localStorage.getItem(LOCAL_KEY);
  // if (rolesGuardados) {
  //   this.roles = JSON.parse(rolesGuardados);
  // }
  // }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.dataTable = new DataTable("#rolesConsultaTable");
    }, 0);
  }

  openAddRoleModal(content: TemplateRef<any>) {
    this.newRole = { rol: '', descripcion: '', tipo: '', aplicacion: '' };
    this.modalService.open(content, { centered: true });
  }

  addRole(modal: any) {
    this.roles.push({ ...this.newRole });
    modal.close();
    setTimeout(() => {
      if (this.dataTable) {
        this.dataTable.destroy();
      }
      this.dataTable = new DataTable("#rolesConsultaTable");
    }, 0);
  }

}