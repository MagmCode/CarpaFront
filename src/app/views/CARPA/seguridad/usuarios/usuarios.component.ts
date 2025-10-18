import { Component, OnInit, TemplateRef } from '@angular/core';
import { AplicacionesService, Aplicacion } from 'src/app/services/aplicaciones-services/aplicaciones.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, Router } from '@angular/router';
import { RolUsuario, Usuario } from 'src/app/core/models/usuarios/usuario';
import { UsuariosService } from 'src/app/services/usuarios/usuarios.service';
import { DataTable } from 'simple-datatables';
import Swal from 'sweetalert2';
import { ModificarStatusService } from 'src/app/services/usuarios/modificarStatus.service';
import { RolesService } from 'src/app/services/roles/roles.service';

@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.scss']
})
export class UsuariosComponent implements OnInit {
  
  usuarioId: string = '';
  userStatus: number = 0;
  aplicacion: string = '';
  listaTodos: string = 'todos';
  aplicaciones: Aplicacion[] = [];
  
  usuarios: Usuario[] = [];
  // temporal para el modal de modificar estatus
  nuevoEstatusMasivo: number | null = 1;

   private dataTable: any;
  
  rolesDisponibles: RolUsuario[] 
  usuarioSeleccionado: Usuario | null = null;
  
  nuevoUsuarioId: string = '';
  nuevoEstatus: number | null = 1;
  nuevoAplicacion: string = '';
  nuevoFullName: string = '';
  nuevoEmail: string = '';
  
  constructor(
    private aplicacionesService: AplicacionesService,
    private modalService: NgbModal,
    private router: Router,
    private usuariosService: UsuariosService,
    private modificarStatusService: ModificarStatusService,
    private route: ActivatedRoute,
    private rolesService: RolesService
  ) { }
  
  itemsPorPagina: number = 10;
  paginaActual: number = 1;
  usuariosFiltrados: Usuario[] = [];
  // Global search and sorting
  searchTerm: string = '';
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  ngOnInit(): void {
    this.aplicaciones = this.aplicacionesService.getAplicaciones();
    this.usuariosAll()

    // this.cargarUsuariosDesdeLocalStorage();
    // const resolvedUsuarios = this.route.snapshot.data['usuarios'];

  // this.usuariosService.usuarios$.subscribe((usuarios) => {
  //     if (usuarios && usuarios.length > 0) {
  //   this.usuarios = this.mapBackendUsuarios(usuarios); 
  //   console.log('roles[]',usuarios)
  //   setTimeout(() => {
  //     if (this.dataTable) {
  //       this.dataTable.destroy();
  //     }
  //     this.dataTable = new DataTable("#rolesConsultaTable");
  //   }, 0);
  // }
  // });

  }

  // --- Batch file handling state ---
  archivoLoteSeleccionado: File | null = null;
  archivoEliminarSeleccionado: File | null = null;

  // Abrir modal de agregar en lote
  openAgregarEnLote(template: TemplateRef<any>) {
    this.archivoLoteSeleccionado = null;
    this.modalService.open(template, { centered: true });
  }

  // Abrir modal de eliminar en lote
  openEliminarEnLote(template: TemplateRef<any>) {
    this.archivoEliminarSeleccionado = null;
    this.modalService.open(template, { centered: true });
  }

  // Selección de archivo para agregar en lote
  onFileSelected(event: any) {
    const file: File = event.target.files && event.target.files[0];
    if (file) this.archivoLoteSeleccionado = file;
  }

  // Selección de archivo para eliminar en lote
  onFileSelectedToDelete(event: any) {
    const file: File = event.target.files && event.target.files[0];
    if (file) this.archivoEliminarSeleccionado = file;
  }

  // Procesar subida (placeholder)
  procesarAgregarLote(modal: any) {
    if (!this.archivoLoteSeleccionado) {
      Swal.fire({ title: 'Sin archivo', text: 'Seleccione un archivo Excel para procesar.', icon: 'info' });
      return;
    }
    this.showSuccessToast('Procesando archivo', `Archivo: ${this.archivoLoteSeleccionado.name}`);
    modal.close();
    // TODO: implementar parsing y creación de usuarios
  }

  // Invocado por el modal para eliminar filtrados (usa el método existente confirmarEliminarEnLote)
  confirmarEliminarEnLoteModal(modal: any) {
    this.confirmarEliminarEnLote();
    modal.close();
  }

  // Procesar eliminación desde archivo (placeholder)
  procesarEliminarDesdeArchivo(modal: any) {
    if (!this.archivoEliminarSeleccionado) {
      Swal.fire({ title: 'Sin archivo', text: 'Seleccione un archivo con IDs para eliminar.', icon: 'info' });
      return;
    }
    this.showSuccessToast('Procesando archivo de eliminación', `Archivo: ${this.archivoEliminarSeleccionado.name}`);
    modal.close();
    // TODO: implementar lectura del archivo y eliminación por IDs
  }

  // Mostrar confirmación antes de procesar eliminación desde archivo
  confirmarProcesarEliminarArchivo(modal: any) {
    if (!this.archivoEliminarSeleccionado) {
      Swal.fire({ title: 'Sin archivo', text: 'Seleccione un archivo con IDs para eliminar.', icon: 'info' });
      return;
    }
    Swal.fire({
      title: '¿Está seguro?',
      text: `Se eliminarán los usuarios indicados en el archivo: ${this.archivoEliminarSeleccionado.name}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.procesarEliminarDesdeArchivo(modal);
      }
    });
  }

  // Helper: mostrar un toast success en la esquina superior derecha
  showSuccessToast(title: string, text?: string) {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title,
      text,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true
    });
  }

  usuariosAll() {
     this.usuariosService.consultarUsuarios().subscribe({
    next: (data) => {
      // if backend returned data use it, otherwise fall back to sample data
      const hasData = Array.isArray(data) && data.length > 0;
      if (hasData) {
        // this.usuariosService.setUsuarios(data);
        localStorage.setItem('usuariosConsultados', JSON.stringify(data));
        this.usuarios = this.mapBackendUsuarios(data);
        console.log('Usuarios All (backend):', this.usuarios);
      } else {
        console.warn('No se recibieron usuarios desde backend, usando datos de ejemplo.');
        const sample = this.generateSampleUsuarios(20);
        // this.usuariosService.setUsuarios(sample);
        localStorage.setItem('usuariosConsultados', JSON.stringify(sample));
        this.usuarios = this.mapBackendUsuarios(sample);
        console.log('Usuarios All (sample):', this.usuarios);
      }
      // apply filtering/sorting/pagination after setting usuarios
      this.filtrarUsuarios();
    },
      error: (err) => {
        console.error('Error al consultar usuarios, usando datos de ejemplo:', err);
        const sample = this.generateSampleUsuarios(20);
        // this.usuariosService.setUsuarios(sample);
        localStorage.setItem('usuariosConsultados', JSON.stringify(sample));
        this.usuarios = this.mapBackendUsuarios(sample);
        this.filtrarUsuarios();
      }
  });
  }

  // Genera usuarios de ejemplo (suficientes para pruebas)
  private generateSampleUsuarios(count: number): any[] {
    const samples: any[] = [];
    for (let i = 1; i <= count; i++) {
      samples.push({
        mscUserId: 1000 + i,
        userId: `user${i}`,
        fullName: `Usuario Ejemplo ${i}`,
        email: `user${i}@example.com`,
        userStatus: i % 2 === 0 ? 1 : 0,
        roles: [
          {
            id: i % 3 === 0 ? 1 : 2,
            alias: i % 3 === 0 ? 'ADMIN' : 'INV',
            descripcion: i % 3 === 0 ? 'Administrador' : 'Inventario',
            tipo: i % 2 === 0 ? 'Usuarios de la Torre' : 'Usuarios de Red Comercial',
            aplicacion: i % 2 === 0 ? 'Gestión Usuarios' : 'Inventario'
          }
        ]
      });
    }
    return samples;
  }

  private mapBackendUsuarios(backendUsuarios: any[]): Usuario[] {
  return backendUsuarios.map(u => ({
    mscUserId: u.mscUserId ?? 0,
    userId: u.userId ?? '',
    fullName: u.fullName ?? '',
    email: u.email ?? '',
    userStatus: u.userStatus ?? 0,
    roles: Array.isArray(u.roles) ? u.roles : [],
    // agregar flag seleccionado para la selección de filas
    seleccionado: false as any
  }));
}

  cargarUsuariosDesdeLocalStorage() {
  const LOCAL_KEY = 'usuariosConsultados';
  const usuariosGuardados = localStorage.getItem(LOCAL_KEY);
  console.log("usuarios guardados", usuariosGuardados);
  if (usuariosGuardados) {
    const usuarios = JSON.parse(usuariosGuardados);
    this.usuarios = this.mapBackendUsuarios(usuarios);
    this.filtrarUsuarios();
    setTimeout(() => {
      if (this.dataTable) {
        this.dataTable.destroy();
      }
      this.dataTable = new DataTable("#rolesConsultaTable");
    }, 0);
  }
}

  filtrarUsuarios() {
    this.paginaActual = 1;
    const term = this.searchTerm.trim().toLowerCase();
    this.usuariosFiltrados = this.usuarios.filter(u =>
      (!this.usuarioId || u.userId.toLowerCase().includes(this.usuarioId.toLowerCase())) &&
      // (!this.userStatus || u.userStatus === this.userStatus) &&
      (!this.aplicacion || u.roles.some(r => r.siglasApplic === this.aplicacion)) &&
      (this.listaTodos === 'todos' || u.roles.some(r => r.roleName === this.listaTodos)) &&
      (term === '' || u.userId.toLowerCase().includes(term) || u.fullName.toLowerCase().includes(term) || u.email.toLowerCase().includes(term))
    );

    // apply sorting if requested
    if (this.sortColumn) {
      const col = this.sortColumn as keyof Usuario;
      this.usuariosFiltrados.sort((a, b) => {
        let valA: any = a[col] as any;
        let valB: any = b[col] as any;
        if (valA === undefined || valA === null) valA = '';
        if (valB === undefined || valB === null) valB = '';
        // numeric compare for userStatus
        if (col === 'userStatus') {
          return this.sortDirection === 'asc' ? (valA - valB) : (valB - valA);
        }
        valA = valA.toString().toLowerCase();
        valB = valB.toString().toLowerCase();
        if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
  }

  ordenarPor(col: string): void {
    if (this.sortColumn === col) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = col;
      this.sortDirection = 'asc';
    }
    this.filtrarUsuarios();
  }

  // Compatibility wrappers used by the template (some HTML was copied from aplicaciones)
  filtrarAplicaciones(): void {
    // delegate to the actual usuarios filter
    this.filtrarUsuarios();
  }
  
  consultar() {
    this.router.navigate(['/seguridad/usuarios/consultas']);
  }
  
  openAddUserModal(content: any) {
    this.nuevoUsuarioId = '';
    this.nuevoEstatus = 1; // por defecto Activo
    this.nuevoFullName = '';
    this.nuevoEmail = '';
    this.nuevoAplicacion = '';
    this.modalService.open(content, { centered: true });
  }

  // Template in some views calls openAddApplicationModal — provide a wrapper
  openAddApplicationModal(content: any) {
    this.openAddUserModal(content);
  }
  
  addUser(modal: any) {
    // create a new user from the modal inputs
    const newUser: Usuario = {
      mscUserId: String(Date.now()),
      userId: this.nuevoUsuarioId,
      fullName: this.nuevoFullName || '',
      email: this.nuevoEmail || '',
      userStatus: Number(this.nuevoEstatus) || 0,
      roles: [],
      imported: false
    };
    this.usuarios = [newUser, ...this.usuarios];
    this.filtrarUsuarios();
    this.showSuccessToast('Usuario añadido', `User ID: ${newUser.userId}`);
    modal.close();
  }
  
  openEliminarModal(usuario: Usuario, TemplateRef: TemplateRef<any>) {
    this.usuarioSeleccionado = usuario;
    this.modalService.open(TemplateRef, { centered: true });
  }

  

  // Confirmar y eliminar todos los usuarios actualmente filtrados
  confirmarEliminarEnLote() {
    if (!this.usuariosFiltrados || this.usuariosFiltrados.length === 0) {
      Swal.fire({ title: 'Sin registros', text: 'No hay usuarios filtrados para eliminar.', icon: 'info' });
      return;
    }
    Swal.fire({
      title: `Eliminar ${this.usuariosFiltrados.length} usuarios?`,
      text: 'Esta acción eliminará los usuarios visibles en la lista filtrada. No se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        const idsAEliminar = new Set(this.usuariosFiltrados.map(u => u.userId));
        this.usuarios = this.usuarios.filter(u => !idsAEliminar.has(u.userId));
        this.filtrarUsuarios();
        this.showSuccessToast('Eliminados', `${idsAEliminar.size} usuarios eliminados.`);
      }
    });
  }
  
  eliminarUsuario(usuario: Usuario, modal: any) {
    this.usuarios = this.usuarios.filter(u => u.userId !== usuario.userId);
    modal.close();
  }

  // Use SweetAlert confirmation similar to Aplicaciones component
  confirmarEliminarUsuario(usuario: Usuario) {
    Swal.fire({
      title: `¿Desea eliminar el usuario "${usuario.userId}"?`,
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.usuarios = this.usuarios.filter(u => u.userId !== usuario.userId);
        this.filtrarUsuarios();
        this.showSuccessToast('Eliminado', `El usuario "${usuario.userId}" ha sido eliminado.`);
      }
    });
  }
  
    openEditarModal(usuario: Usuario, TemplateRef: TemplateRef<any>) {
    this.usuarioSeleccionado = { ...usuario };
    this.modalService.open(TemplateRef, { centered: true });
  }

  procesarStatus(modal: any) {
    const userId  = this.usuarioSeleccionado?.userId;
    const userStatus  = this.usuarioSeleccionado?.userStatus;
    console.log("procesar", userId, userStatus)
    if (userId !== undefined && userStatus !== undefined) {
      const payload = {
        userId: userId,
        userStatus: userStatus
      };
      this.modificarStatusService.modificarStatus(payload).subscribe({
        next: (response: any) => {
          console.log("respuesta de estatus", response);
          JSON.stringify(response);
          modal.close();
          this.usuariosAll();
        }
      });
    } else {
      console.error('userId or userStatus is undefined');
    }
  }
  
  guardarEdicionUsuario(modal: any) {
    if (!this.usuarioSeleccionado) {
      modal.close();
      return;
    }

    const payload: any = {
      userId: this.usuarioSeleccionado.userId,
      userStatus: this.usuarioSeleccionado.userStatus
    };

    // Call backend update with minimal payload { userId, userStatus }
    this.usuariosService.updateUsuario(payload).subscribe({
      next: (updated: any) => {
        // Normalize and update local list
        const mapped = this.mapBackendUsuarios([updated])[0] || { ...this.usuarioSeleccionado };
        const idx = this.usuarios.findIndex(u => u.userId === (mapped.userId || this.usuarioSeleccionado!.userId));
        if (idx !== -1) {
          this.usuarios[idx] = mapped;
        }
        this.filtrarUsuarios();
        modal.close();
        this.showSuccessToast('Usuario actualizado', `Usuario ${payload.userId} actualizado.`);
      },
      error: (err) => {
        console.error('Error guardando edición', err);
        Swal.fire({ title: 'Error', text: 'No se pudo guardar la edición.', icon: 'error' });
      }
    });
  }
  
  openVerRolesModal(usuario: Usuario, TemplateRef: TemplateRef<any>) {
    // fetch roles associated to this user by mscUserId and open modal with only those roles
    const msc = usuario.mscUserId;
    this.usuariosService.getRolesUsuario(String(msc)).subscribe({
      next: (roles: any) => {
        // Normalize backend role shape to the UI model (RolUsuario)
        const list = Array.isArray(roles) ? roles : (roles?.data && Array.isArray(roles.data) ? roles.data : []);
        const normalized = list.map((r: any) => ({
          // preserve backend original fields (used by the template)
          mscRoleId: r.mscRoleId ?? r.id ?? 0,
          roleName: r.roleName ?? r.alias ?? '',
          description: r.description ?? r.descripcion ?? '',
          inUsoEnRed: r.inUsoEnRed ?? r.tipo ?? '',
          siglasApplic: r.siglasApplic ?? r.aplicacion ?? r.application ?? '',
          // also provide UI-friendly aliases (backwards compatibility)
          id: r.mscRoleId ?? r.id ?? 0,
          alias: r.roleName ?? r.alias ?? '',
          descripcion: r.description ?? r.descripcion ?? '',
          tipo: r.inUsoEnRed ?? r.tipo ?? '',
          aplicacion: r.siglasApplic ?? r.aplicacion ?? r.application ?? ''
  } as any));
        this.usuarioSeleccionado = { ...usuario, roles: normalized } as Usuario;
        this.modalService.open(TemplateRef, { centered: true, size: 'xl' });
      },
      error: (err) => {
        console.error('Error obteniendo roles', err);
        Swal.fire({ title: 'Error', text: 'No se pudieron obtener los roles del usuario.', icon: 'error' });
      }
    });

  }
  
  openAsociarRolesModal(usuario: Usuario, TemplateRef: TemplateRef<any>) {
    // First fetch roles assigned to the user, then fetch all roles and mark selections by mscRoleId
    this.usuarioSeleccionado = usuario;
    const msc = usuario.mscUserId;
    this.usuariosService.getRolesUsuario(String(msc)).subscribe({
      next: (assigned: any) => {
        const assignedList = Array.isArray(assigned) ? assigned : (Array.isArray(assigned?.data) ? assigned.data : []);
        const assignedIds = new Set(assignedList.map((ar: any) => String(ar.mscRoleId ?? ar.id ?? ar.roleId ?? '')));

        // fetch all roles
        this.rolesService.consultarRoles({}).subscribe({
          next: (resp: any) => {
            const list = Array.isArray(resp?.data) ? resp.data : (Array.isArray(resp) ? resp : []);
            this.rolesDisponibles = list.map((r: any) => {
              const idVal = r.mscRoleId ?? r.id ?? 0;
              const idStr = String(idVal);
              return ({
                // preserve backend id and ui aliases
                mscRoleId: idVal,
                id: idVal,
                roleName: r.roleName ?? r.alias ?? r.rol ?? r.name ?? '',
                alias: r.roleName ?? r.alias ?? r.rol ?? r.name ?? '',
                description: r.description ?? r.descripcion ?? '',
                descripcion: r.description ?? r.descripcion ?? '',
                inUsoEnRed: r.inUsoEnRed ?? r.tipo ?? r.type ?? '',
                tipo: r.inUsoEnRed ?? r.tipo ?? r.type ?? '',
                siglasApplic: r.siglasApplic ?? r.aplicacion ?? r.application ?? '',
                aplicacion: r.siglasApplic ?? r.aplicacion ?? r.application ?? '',
                seleccionado: assignedIds.has(idStr)
              } as RolUsuario & { seleccionado?: boolean });
            });
            this.modalService.open(TemplateRef, { centered: true, size: 'xl' });
          },
          error: (err) => {
            console.error('Error cargando roles disponibles', err);
            Swal.fire({ title: 'Error', text: 'No se pudieron cargar los roles disponibles.', icon: 'error' });
          }
        });
      },
      error: (err) => {
        console.error('Error cargando roles asignados del usuario', err);
        // fallback: load all roles without pre-selection
        this.rolesService.consultarRoles({}).subscribe({
          next: (resp: any) => {
            const list = Array.isArray(resp?.data) ? resp.data : (Array.isArray(resp) ? resp : []);
            this.rolesDisponibles = list.map((r: any) => ({
              id: r.mscRoleId ?? r.id ?? 0,
              alias: r.roleName ?? r.alias ?? r.rol ?? r.name ?? '',
              descripcion: r.description ?? r.descripcion ?? '',
              tipo: r.inUsoEnRed ?? r.tipo ?? r.type ?? '',
              aplicacion: r.siglasApplic ?? r.aplicacion ?? r.application ?? '',
              seleccionado: false
            } as RolUsuario & { seleccionado?: boolean }));
            this.modalService.open(TemplateRef, { centered: true, size: 'xl' });
          },
          error: (err2) => {
            console.error('Error cargando roles disponibles', err2);
            Swal.fire({ title: 'Error', text: 'No se pudieron cargar los roles disponibles.', icon: 'error' });
          }
        });
      }
    });
  }
  
  guardarAsociacionRoles(usuario: Usuario, modal: any) {
    const rolesSeleccionados = this.rolesDisponibles.filter(r => (r as any).seleccionado);
    console.log('Roles seleccionados para asignar:', rolesSeleccionados);
    const idx = this.usuarios.findIndex(u => u.userId === usuario.userId);
    // Build payload for backend
    // send as userId but with the value of mscUserId (backend expects userId field)
    const payload = {
      userId: usuario.mscUserId,
      // prefer mscRoleId when present, otherwise fallback to id
      roleIds: rolesSeleccionados.map(r => (r as any).mscRoleId)
    };

    this.usuariosService.asignarRoles(payload).subscribe({
      next: (resp: any) => {
        // update local user's roles to the selected ones
        if (idx !== -1) {
          this.usuarios[idx].roles = rolesSeleccionados.map(r => ({
            mscRoleId: r.mscRoleId,
            roleName: r.roleName,
            description: r.description,
            inUsoEnRed: r.inUsoEnRed,
            siglasAplic: r.siglasApplic
          }));
        }
        this.filtrarUsuarios();
        modal.close();
        this.showSuccessToast('Roles asignados', `Se asignaron ${rolesSeleccionados.length} roles.`);
      },
      error: (err) => {
        console.error('Error asignando roles', err);
        Swal.fire({ title: 'Error', text: 'No se pudieron asignar los roles.', icon: 'error' });
      }
    });
  }
  
  get totalPaginas(): number {
    return Math.ceil(this.usuariosFiltrados.length / this.itemsPorPagina) || 1;
  }
  
  get paginas(): number[] {
    return Array(this.totalPaginas).fill(0).map((_, i) => i + 1);
  }
  
  get usuariosPaginados(): Usuario[] {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    return this.usuariosFiltrados.slice(inicio, inicio + this.itemsPorPagina);
  }
  
  cambiarPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  cambiarPageSize(nuevoSize: number) {
    this.itemsPorPagina = Number(nuevoSize) || 10;
    this.paginaActual = 1;
    this.filtrarUsuarios();
  }

  toggleSelectAll(e: any) {
    const checked = !!e.target.checked;
    this.usuariosFiltrados.forEach(u => (u as any).seleccionado = checked);
  }

  isAllSelected(): boolean {
    return this.usuariosFiltrados && this.usuariosFiltrados.length > 0 && this.usuariosFiltrados.every(u => !!u.seleccionado);
  }

  // UI helpers to manage large selections in the modal
  showAllSelected: boolean = false;
  previewLimit: number = 10;

  selectedCount(): number {
    return this.usuarios.filter(u => (u as any).seleccionado).length;
  }

  selectedPreview(limit: number = this.previewLimit): Usuario[] {
    return this.usuarios.filter(u => (u as any).seleccionado).slice(0, limit);
  }

  toggleShowAllSelected() {
    this.showAllSelected = !this.showAllSelected;
  }

  openModificarEstatusModal(template: TemplateRef<any>) {
    // abrir modal mostrando resumen de seleccionados
    const seleccionados = this.usuarios.filter(u => (u as any).seleccionado);
    if (!seleccionados || seleccionados.length === 0) {
      Swal.fire({ title: 'Sin selección', text: 'Debe seleccionar al menos 1 usuario.', icon: 'info' });
      return;
    }
    this.nuevoEstatusMasivo = 1;
    this.modalService.open(template, { centered: true });
  }

  aplicarModificacionEstatus(modal: any) {
    const seleccionados = this.usuarios.filter(u => (u as any).seleccionado);
    if (!seleccionados || seleccionados.length === 0) {
      Swal.fire({ title: 'Sin selección', text: 'No hay usuarios seleccionados.', icon: 'info' });
      return;
    }
    // aplicar estatus a los usuarios seleccionados
    seleccionados.forEach(u => u.userStatus = Number(this.nuevoEstatusMasivo) );
    this.filtrarUsuarios();
    modal.close();
    this.showSuccessToast('Estatus actualizado', `${seleccionados.length} usuario(s) actualizados.`);
  }

  salir() {
    console.log('Salir');
  }
}
