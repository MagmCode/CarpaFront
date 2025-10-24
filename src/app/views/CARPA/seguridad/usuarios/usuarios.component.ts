import { Component, OnInit, TemplateRef } from '@angular/core';
import { ViewChild } from '@angular/core';
import {
  AplicacionesService,
  Aplicacion,
} from 'src/app/services/aplicaciones-services/aplicaciones.service';
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
  styleUrls: ['./usuarios.component.scss'],
})
export class UsuariosComponent implements OnInit {
  // Para el modal de asociar roles
  aplicacionSeleccionadaRolesModal:  Aplicacion['siglasApplic'] | null = null;
  rolesFiltradosModal: RolUsuario[] = [];

  filtrarRolesPorAplicacion() {
    if (!this.aplicacionSeleccionadaRolesModal) {
      this.rolesFiltradosModal = [];
      return;
    }
    this.rolesFiltradosModal = (this.rolesDisponibles || []).filter(r => r.siglasAplic === this.aplicacionSeleccionadaRolesModal);
  }
  passwordFormSubmitted = false;
  showActualPassword: boolean = false;
  showNuevaPassword: boolean = false;
  showRepitePassword: boolean = false;
  @ViewChild('addUserForm') addUserFormRef: any;
  // Referencia al formulario de agregar usuario
  // Limita el campo cédula a 9 dígitos numéricos
  limitarCedula(event: any) {
    const input = event.target as HTMLInputElement;
    let valor = input.value.replace(/\D/g, '');
    if (valor.length > 9) valor = valor.slice(0, 9);
    input.value = valor;
    this.nuevoCedula = valor;
  }
  // Validaciones NobleUI
  validarCedula(cedula: string | number | null | undefined): boolean {
    if (cedula === null || cedula === undefined) return false;
    const ced = String(cedula);
    return /^\d{6,9}$/.test(ced);
  }

  validarClave(clave: string): boolean {
    // Mínimo 8 caracteres, al menos una mayúscula, una minúscula, un número y un símbolo
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(clave);
  }

  validarCorreo(correo: string): boolean {
    // Debe tener @ y terminar en .com, .gob, .net, .org, .ve, etc
    return /^[\w.-]+@[\w.-]+\.(com|gob|net|org|ve|edu|info|biz)$/i.test(correo);
  }
  // Campos para el cambio de contraseña
  passwordActual: string = '';
  passwordNueva: string = '';
  passwordRepite: string = '';

  // Abrir modal de cambio de contraseña
  openPasswordModal(usuario: Usuario, template: any) {
    this.usuarioSeleccionado = usuario;
    this.passwordNueva = '';
    this.passwordRepite = '';
    this.modalService.open(template, { centered: true });
  }

  // --- Password Modal ---
  passwordVigencia: number = 180;

  // Procesar cambio de contraseñavige
  cambiarPassword(modal: any) {
    if (!this.usuarioSeleccionado) {
      modal?.close();
      return;
    }
    if ( !this.passwordNueva || !this.passwordRepite) {
      this.passwordFormSubmitted = true;
      return;
    }
    if (!this.validarClave(this.passwordNueva)) {
      this.passwordFormSubmitted = true;
      return;
    }
    this.passwordFormSubmitted = false;
    if (this.passwordNueva !== this.passwordRepite) {
      Swal.fire({
        title: 'Error',
        text: 'Las contraseñas nuevas no coinciden.',
        icon: 'error',
      });
      return;
    }
    const token = localStorage.getItem('token');
    if (token === 'fake-token') {
      modal?.close();
      this.showSuccessToast('Contraseña cambiada (local)', `Usuario: ${this.usuarioSeleccionado.userId}`);
      return;
    }
    // Llamar servicio real de cambio de contraseña
    const payload = {
      userId: this.usuarioSeleccionado.userId,
      password: this.passwordNueva,
      passwordDays: this.passwordVigencia
    };
    this.usuariosService.changePassword(payload).subscribe({
      next: (resp: any) => {
        modal?.close();
        this.showSuccessToast('Contraseña cambiada', `Usuario: ${this.usuarioSeleccionado?.userId}`);
      },
      error: (err: any) => {
        Swal.fire({
          title: 'Error',
          text: 'No se pudo cambiar la contraseña.',
          icon: 'error',
        });
      },
    });
  }
  // Loading states for modals
  modalLoadingEditar: boolean = false;
  modalLoadingVerRoles: boolean = false;
  modalLoadingVincularRoles: boolean = false;
  ldapLoading: boolean = false;
  ldapUsuarioBuscado: boolean = false;
  buscarUsuarioLDAP(login: string) {
    this.ldapLoading = true;
    this.ldapUsuarioBuscado = false;
    this.usuariosService.buscarUsuario(login).subscribe({
      next: (resp: any) => {
        let user = resp;
        if (Array.isArray(resp)) {
          user = resp[0];
        }
        if (user) {
          this.nuevoLogin = user.codigo || login;
          this.nuevoFullName = user.nombreCompleto || 'error';
          this.nuevoEmail = user.correo || 'error';
          this.nuevoEstatus = user.estatus === 'A' ? 1 : user.estatus === 'I' ? 0 : 1;
          this.ldapLoading = false;
          this.nuevoDescCargo = user.cargo || 'error';
          this.nuevoCedula = user.cedula || null;
          this.nuevoDescGeneral = user.descUnidad || 'error';
          this.ldapUsuarioBuscado = true;
        } else {
          this.nuevoLogin = login;
          this.nuevoFullName = '';
          this.nuevoEmail = '';
          this.nuevoEstatus = 1;
          this.ldapLoading = false;
          this.nuevoDescCargo = '';
          this.nuevoCedula = null;
          this.nuevoDescGeneral = '';
          this.ldapUsuarioBuscado = false;
          Swal.fire({
            title: 'No encontrado',
            text: 'No se encontró el usuario en el directorio activo.',
            icon: 'info',
          });
        }
      },
      error: (err: any) => {
        this.nuevoLogin = login;
        this.nuevoFullName = '';
        this.nuevoEmail = '';
        this.nuevoEstatus = 1;
        this.ldapLoading = false;
        this.nuevoDescCargo = '';
        this.nuevoCedula = null;
        this.nuevoDescGeneral = '';
        this.ldapUsuarioBuscado = false;
        if (err && err.message === 'no existe el usuario en Active directory') {
          Swal.fire({
            title: 'No encontrado',
            text: 'No se encontró el usuario en el directorio activo.',
            icon: 'info',
          });
        } else {
          console.error('Error buscando usuario en LDAP:', err);
          Swal.fire({
            title: 'Error',
            text: 'Ocurrió un error al buscar el usuario. Vuelva a intentar.',
            icon: 'error',
          });
        }
      },
    });
  }
  showClave: boolean = false;
  loading = false;

  // Nuevos campos para el formulario según requerimiento
  nuevoDescCargo: string = '';
  nuevoDescGeneral: string = '';
  nuevoVigencia: number = 180; // passwordDays
  limpiarFormularioNuevoUsuario() {
  this.nuevoTypeAccess = '';
  this.nuevoLogin = '';
  this.nuevoClave = '';
  this.nuevoEncriptamiento = '';
  this.nuevoCedula = null;
  this.nuevoDescripcion = '';
  this.nuevoVigencia = 180;
  this.nuevoFullName = '';
  this.nuevoEmail = '';
  this.nuevoEstatus = 1;
  this.datosDirectorioActivo = null;
  this.nuevoDescCargo = '';
  this.nuevoDescGeneral = '';
  }

  limpiarType(){
      this.nuevoLogin = '';
  this.nuevoClave = '';
  this.nuevoEncriptamiento = '';
  this.nuevoCedula = null;
  this.nuevoDescripcion = '';
  this.nuevoVigencia = 180;
  this.nuevoFullName = '';
  this.nuevoEmail = '';
  this.nuevoEstatus = 1;
  this.datosDirectorioActivo = null;
  this.nuevoDescCargo = '';
  this.nuevoDescGeneral = '';
  }

  onChangeNuevoTypeAccess() {
    this.limpiarType();
    if (this.nuevoTypeAccess === 'Directorio Activo') {
      this.ldapUsuarioBuscado = false;
    }
  }
  // Campos para el formulario de alta de usuario
  nuevoTypeAccess: '' | 'Local' | 'Directorio Activo' = '';
  nuevoLogin: string = '';
  nuevoClave: string = '';
  nuevoEncriptamiento: string = '';
  nuevoCedula: string | number | null = null;
  nuevoDescripcion: string = '';
  passwordDays: number = 180;
  nuevoFullName: string = '';
  nuevoEmail: string = '';
  nuevoEstatus: number | null = 1;
  datosDirectorioActivo: any = null;
  nuevoEditable: boolean = true;
  nuevoDescUnidad: string = '';
  nuevoCodigo: string = '';

  // Stub para consulta de directorio activo
  consultarDirectorioActivo(login: string) {
    // Llama al backend para buscar usuario por userId (login)
    console.log('[consultarDirectorioActivo] Buscando usuario:', login);
    this.usuariosService.buscarUsuario(login).subscribe({
      next: (resp: any) => {
        console.log('[consultarDirectorioActivo] Respuesta del backend:', resp);
        let user = resp;
        if (Array.isArray(resp)) {
          user = resp[0];
        }
        if (user) {
          this.nuevoLogin = user.userId || login;
          this.nuevoFullName = user.fullName || '';
          this.nuevoEmail = user.email || '';
          this.nuevoEstatus = user.userStatus ?? 1;
          console.log('[consultarDirectorioActivo] Asignados:', {
            nuevoLogin: this.nuevoLogin,
            nuevoFullName: this.nuevoFullName,
            nuevoEmail: this.nuevoEmail,
            nuevoEstatus: this.nuevoEstatus,
          });
        } else {
          this.nuevoLogin = login;
          this.nuevoFullName = '';
          this.nuevoEmail = '';
          this.nuevoEstatus = 1;
          console.log(
            '[consultarDirectorioActivo] Usuario no encontrado, valores por defecto asignados'
          );
        }
      },
      error: (err: any) => {
        this.nuevoLogin = login;
        this.nuevoFullName = '';
        this.nuevoEmail = '';
        this.nuevoEstatus = 1;
        console.error('[consultarDirectorioActivo] Error en búsqueda:', err);
        Swal.fire({
          title: 'No encontrado',
          text: 'No se encontró el usuario en el directorio activo.',
          icon: 'info',
        });
      },
    });
  }

  usuarioId: string = '';
  userStatus: number = 0;
  aplicacion: string = '';
  listaTodos: string = 'todos';
  aplicaciones: Aplicacion[] = [];

  usuarios: Usuario[] = [];
  // temporal para el modal de modificar estatus
  nuevoEstatusMasivo: number | null = 1;

  private dataTable: any;

  rolesDisponibles: RolUsuario[];
  usuarioSeleccionado: Usuario | null = null;

  nuevoUsuarioId: string = '';
  nuevoAplicacion: string = '';

  constructor(
    private aplicacionesService: AplicacionesService,
    private modalService: NgbModal,
    private router: Router,
    private usuariosService: UsuariosService,
    private modificarStatusService: ModificarStatusService,
    private route: ActivatedRoute,
    private rolesService: RolesService
  ) {}

  itemsPorPagina: number = 10;
  paginaActual: number = 1;
  usuariosFiltrados: Usuario[] = [];
  // Global search and sorting
  searchTerm: string = '';
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Filtro para tipo de acceso (Local, Directorio Activo, Todos)
  filtroTipoAcceso: string = '';

  ngOnInit(): void {
    this.aplicacionesService.getAplicaciones$().subscribe(apps => {
      this.aplicaciones = apps || [];
    });
    this.aplicacionesService.loadAplicaciones().subscribe({ next: () => {}, error: () => {} });
    // Detectar token
    const token = localStorage.getItem('token');
    if (token === 'fake-token') {
      // Modo offline: mostrar datos ficticios
      this.usuarios = this.mapBackendUsuarios(this.generateSampleUsuarios(40));
      this.filtrarUsuarios();
      this.loading = false;
    } else {
      // Suscribirse al observable de usuarios para actualización automática
      this.usuariosService.usuarios$.subscribe((data) => {
        this.usuarios = this.mapBackendUsuarios(data);
        this.filtrarUsuarios();
        this.loading = false;
      });
      // Disparar la consulta inicial
      this.loading = true;
      this.usuariosService.consultarUsuarios().subscribe({
        next: () => {
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          Swal.fire({ title: 'Error', text: 'No se pudieron cargar los usuarios.', icon: 'error' });
        }
      });
    }
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
      Swal.fire({
        title: 'Sin archivo',
        text: 'Seleccione un archivo Excel para procesar.',
        icon: 'info',
      });
      return;
    }
    this.showSuccessToast(
      'Procesando archivo',
      `Archivo: ${this.archivoLoteSeleccionado.name}`
    );
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
      Swal.fire({
        title: 'Sin archivo',
        text: 'Seleccione un archivo con IDs para eliminar.',
        icon: 'info',
      });
      return;
    }
    this.showSuccessToast(
      'Procesando archivo de eliminación',
      `Archivo: ${this.archivoEliminarSeleccionado.name}`
    );
    modal.close();
    // TODO: implementar lectura del archivo y eliminación por IDs
  }

  // Mostrar confirmación antes de procesar eliminación desde archivo
  confirmarProcesarEliminarArchivo(modal: any) {
    if (!this.archivoEliminarSeleccionado) {
      Swal.fire({
        title: 'Sin archivo',
        text: 'Seleccione un archivo con IDs para eliminar.',
        icon: 'info',
      });
      return;
    }
    Swal.fire({
      title: '¿Está seguro?',
      text: `Se eliminarán los usuarios indicados en el archivo: ${this.archivoEliminarSeleccionado.name}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
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
      timerProgressBar: true,
    });
  }

  usuariosAll() {
    this.usuariosService.consultarUsuarios().subscribe({
      next: (data) => {
        // Solo usar datos del backend, no cargar registros de ejemplo locales
        this.usuarios = this.mapBackendUsuarios(data);
        this.filtrarUsuarios();
      },
      error: (err) => {
        console.error('Error al consultar usuarios:', err);
        // No cargar registros de ejemplo locales
      },
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
            tipo:
              i % 2 === 0
                ? 'Usuarios de la Torre'
                : 'Usuarios de Red Comercial',
            aplicacion: i % 2 === 0 ? 'Gestión Usuarios' : 'Inventario',
          },
        ],
      });
    }
    return samples;
  }

  private mapBackendUsuarios(backendUsuarios: any[]): Usuario[] {
    return backendUsuarios.map((u) => ({
      mscUserId: u.mscUserId ?? 0,
      userId: u.userId ?? '',
      fullName: u.fullName ?? '',
      email: u.email ?? '',
      userStatus: u.userStatus ?? 0,
      roles: Array.isArray(u.roles) ? u.roles : [],
      typeAccess: u.typeAccess ?? '',
      isEditable: u.isEditable ?? true,
      // agregar flag seleccionado para la selección de filas
      seleccionado: false as any,
      cedula: typeof this.nuevoCedula === 'string' ? Number(this.nuevoCedula) || 0 : this.nuevoCedula || 0,
      descCargo: this.nuevoDescCargo || '',
      descGeneral: this.nuevoDescGeneral || '',
      passwordDays: this.nuevoVigencia || 180,
      codigo: this.nuevoCodigo || '',
      descUnidad: this.nuevoDescUnidad || '',
      estatus:
        this.nuevoEstatus === 1 ? 'A' : this.nuevoEstatus === 0 ? 'I' : 'A',
      correo: this.nuevoEmail || '',
      codigoCargo: '',
      nombreCompleto: this.nuevoFullName || '',
      cargo: '',
    }));
  }

  cargarUsuariosDesdeLocalStorage() {
    const LOCAL_KEY = 'usuariosConsultados';
    const usuariosGuardados = localStorage.getItem(LOCAL_KEY);
    console.log('usuarios guardados', usuariosGuardados);
    if (usuariosGuardados) {
      const usuarios = JSON.parse(usuariosGuardados);
      this.usuarios = this.mapBackendUsuarios(usuarios);
      this.filtrarUsuarios();
      setTimeout(() => {
        if (this.dataTable) {
          this.dataTable.destroy();
        }
        this.dataTable = new DataTable('#rolesConsultaTable');
      }, 0);
    }
  }

  filtrarUsuarios() {
    this.paginaActual = 1;
    const term = this.searchTerm.trim().toLowerCase();
    this.usuariosFiltrados = this.usuarios.filter(
      (u) =>
        (!this.usuarioId ||
          u.userId.toLowerCase().includes(this.usuarioId.toLowerCase())) &&
        (!this.aplicacion ||
          u.roles.some((r) => r.siglasAplic === this.aplicacion)) &&
        (this.listaTodos === 'todos' ||
          u.roles.some((r) => r.roleName === this.listaTodos)) &&
        (term === '' ||
          u.userId.toLowerCase().includes(term) ||
          u.fullName.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term)) &&
        (this.filtroTipoAcceso === '' || u.typeAccess === this.filtroTipoAcceso)
    );

    // apply sorting if requested
    if (this.sortColumn) {
      const col = this.sortColumn as keyof Usuario;
      this.usuariosFiltrados.sort((a, b) => {
        const aValue = a[col] ?? '';
        const bValue = b[col] ?? '';
        if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
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
    this.ldapUsuarioBuscado = false;
    const modalRef = this.modalService.open(content, { centered: true });
    // Limpia el formulario en cualquier tipo de cierre (close, dismiss, X, backdrop, ESC)
    modalRef.result.finally(() => {
      this.limpiarFormularioNuevoUsuario();
      this.ldapUsuarioBuscado = false;
    });
  }

  // Template in some views calls openAddApplicationModal — provide a wrapper
  openAddApplicationModal(content: any) {
    // this.openAddUserModal(content);
    const modalRef = this.modalService.open(content, { centered: true, size: 'lg' });
    modalRef.result.finally(() => {
      this.limpiarFormularioNuevoUsuario();
    });
  }

  addUser(modal: any) {
    // Validar solo los campos relevantes según el tipo de acceso
    if (this.nuevoTypeAccess === 'Local') {
      // Validar campos de Local
      if (!this.nuevoLogin || !this.nuevoFullName || !this.nuevoEmail || !this.nuevoClave || !this.nuevoCedula) {
        Swal.fire({
          title: 'Campos requeridos',
          text: 'Complete todos los campos obligatorios para usuario Local.',
          icon: 'warning',
        });
        return;
      }
      if (!this.validarCedula(this.nuevoCedula)) {
        Swal.fire({
          title: 'Cédula inválida',
          text: 'La cédula debe tener entre 6 y 9 dígitos.',
          icon: 'warning',
        });
        return;
      }
      if (!this.validarClave(this.nuevoClave)) {
        Swal.fire({
          title: 'Clave insegura',
          text: 'La clave debe tener al menos 8 caracteres, mayúsculas, minúsculas, números y símbolos.',
          icon: 'warning',
        });
        return;
      }
      if (!this.validarCorreo(this.nuevoEmail)) {
        Swal.fire({
          title: 'Correo inválido',
          text: 'Ingrese un correo válido.',
          icon: 'warning',
        });
        return;
      }
    } else if (this.nuevoTypeAccess === 'Directorio Activo') {
      // Validar campos de LDAP
      if (!this.nuevoLogin) {
        Swal.fire({
          title: 'Login requerido',
          text: 'Ingrese el login de usuario para Directorio Activo.',
          icon: 'warning',
        });
        return;
      }
    } else {
      // fallback: do nothing if type not selected
      Swal.fire({
        title: 'Tipo de acceso requerido',
        text: 'Seleccione Local o Directorio Activo',
        icon: 'warning',
      });
      return;
    }

    let payload: any;
    if (this.nuevoTypeAccess === 'Local') {
      payload = {
        userId: this.nuevoLogin,
        typeAccess: 'LOCAL',
        fullName: this.nuevoFullName,
        email: this.nuevoEmail,
        password: this.nuevoClave,
        cedula: this.nuevoCedula,
        descCargo: this.nuevoDescCargo,
        descGeneral: this.nuevoDescGeneral,
        passwordDays: this.nuevoVigencia,
      };
    } else if (this.nuevoTypeAccess === 'Directorio Activo') {
      payload = {
        userId: this.nuevoLogin,
        typeAccess: 'LDAP',
      };
    }

    this.loading = true;
    this.usuariosService.createUsuario(payload).subscribe({
      next: (created: any) => {
        // La suscripción al observable actualiza la lista automáticamente
        this.filtrarUsuarios();
        this.showSuccessToast('Usuario añadido', `User ID: ${created.userId}`);
        modal.close();
        this.limpiarFormularioNuevoUsuario();
        this.loading = false;
      },
      error: (err: any) => {
        this.loading = false;

        if (err && err.message.includes('El usuario ya existe')) {
          Swal.fire({
            title: 'Usuario existente',
            text: 'Ya existe un usuario con el mismo ID.',
            icon: 'warning',
            showConfirmButton: false,
            timer: 2000,
          });
        } else {
           Swal.fire({
            title: 'Error',
            text: (err && err.message) ? err.message : JSON.stringify(err),
            icon: 'error',
            showConfirmButton: false,
            timer: 2000,
          });
        }
      },
    });
  }

  openEliminarModal(usuario: Usuario, TemplateRef: TemplateRef<any>) {
    this.usuarioSeleccionado = usuario;
    this.modalService.open(TemplateRef, { centered: true });
  }

  // Confirmar y eliminar todos los usuarios actualmente filtrados
  confirmarEliminarEnLote() {
    if (!this.usuariosFiltrados || this.usuariosFiltrados.length === 0) {
      Swal.fire({
        title: 'Sin registros',
        text: 'No hay usuarios filtrados para eliminar.',
        icon: 'info',
      });
      return;
    }
    Swal.fire({
      title: `Eliminar ${this.usuariosFiltrados.length} usuarios?`,
      text: 'Esta acción eliminará los usuarios visibles en la lista filtrada. No se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        const idsAEliminar = new Set(
          this.usuariosFiltrados.map((u) => u.userId)
        );
        this.usuarios = this.usuarios.filter(
          (u) => !idsAEliminar.has(u.userId)
        );
        this.filtrarUsuarios();
        this.showSuccessToast(
          'Eliminados',
          `${idsAEliminar.size} usuarios eliminados.`
        );
      }
    });
  }

  eliminarUsuario(usuario: Usuario, modal: any) {
    this.usuarios = this.usuarios.filter((u) => u.userId !== usuario.userId);
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
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        this.usuarios = this.usuarios.filter(
          (u) => u.userId !== usuario.userId
        );
        this.filtrarUsuarios();
        this.showSuccessToast(
          'Eliminado',
          `El usuario "${usuario.userId}" ha sido eliminado.`
        );
      }
    });
  }

  openEditarModal(usuario: Usuario, TemplateRef: TemplateRef<any>) {
    console.log('Editar usuario:', usuario);
    this.modalLoadingEditar = true;
    const openModal = () => {
      const modalRef = this.modalService.open(TemplateRef, { centered: true, size: 'lg' });
      modalRef.result.finally(() => {
        this.limpiarFormularioNuevoUsuario();
      });
    };
    // if (usuario.typeAccess === 'LDAP') {
      this.usuariosService.buscarUsuarioLocal(usuario.userId).subscribe({
        next: (resp: any) => {
          let user = Array.isArray(resp) ? resp[0] : resp;
          if (user) {
            this.usuarioSeleccionado = {
              ...usuario,
              userId:  user.userId,
              fullName: user.fullName,
              email:  user.email,
              userStatus: user.userStatus,
              cargo: user.descCargo,
              cedula: user.cedula,
              descGeneral: user.descGeneral,
            };
          } else {
            this.usuarioSeleccionado = { ...usuario };
          }
          this.modalLoadingEditar = false;
          openModal();
        },
        error: () => {
          this.usuarioSeleccionado = { ...usuario };
          this.modalLoadingEditar = false;
          openModal();
        }
      });
    // } else {
    //   this.usuarioSeleccionado = { ...usuario };
    //   this.modalLoadingEditar = false;
    //   openModal();
    // }
  }

  procesarStatus(modal: any) {
    const userId = this.usuarioSeleccionado?.userId;
    const userStatus = this.usuarioSeleccionado?.userStatus;
    console.log('procesar', userId, userStatus);
    if (userId !== undefined && userStatus !== undefined) {
      const payload = {
        userId: userId,
        userStatus: userStatus,
      };
      this.modificarStatusService.modificarStatus(payload).subscribe({
        next: (response: any) => {
          console.log('respuesta de estatus', response);
          JSON.stringify(response);
          modal.close();
          this.usuariosAll();
        },
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
      cedula: this.usuarioSeleccionado.cedula,
      description: this.usuarioSeleccionado.descGeneral,
      passwordDays: this.usuarioSeleccionado.passwordDays,
      fullName: this.usuarioSeleccionado.fullName,
      email: this.usuarioSeleccionado.email,
      userStatus: this.usuarioSeleccionado.userStatus,
    };

    // Call backend update with minimal payload { userId, userStatus }
    this.usuariosService.updateUsuario(payload).subscribe({
      next: (updated: any) => {
        // Normalize and update local list
        const mapped = this.mapBackendUsuarios([updated])[0] || {
          ...this.usuarioSeleccionado,
        };
        const idx = this.usuarios.findIndex(
          (u) =>
            u.userId === (mapped.userId || this.usuarioSeleccionado!.userId)
        );
        if (idx !== -1) {
          this.usuarios[idx] = mapped;
        }
        this.filtrarUsuarios();
        modal.close();
        this.showSuccessToast(
          'Usuario actualizado',
          `Usuario ${payload.userId} actualizado.`
        );
      },
      error: (err) => {
        console.error('Error guardando edición', err);
        Swal.fire({
          title: 'Error',
          text: 'No se pudo guardar la edición.',
          icon: 'error',
        });
      },
    });
  }

  openVerRolesModal(usuario: Usuario, TemplateRef: TemplateRef<any>) {
    this.modalLoadingVerRoles = true;
    const msc = usuario.mscUserId;
    this.usuariosService.getRolesUsuario(String(msc)).subscribe({
      next: (roles: any) => {
        const list = Array.isArray(roles)
          ? roles
          : roles?.data && Array.isArray(roles.data)
          ? roles.data
          : [];
        const normalized = list.map(
          (r: any) =>
            ({
              mscRoleId: r.mscRoleId ?? r.id ?? 0,
              roleName: r.roleName ?? r.alias ?? '',
              description: r.description ?? r.descripcion ?? '',
              inUsoEnRed: r.inUsoEnRed ?? r.tipo ?? '',
              siglasApplic:
                r.siglasApplic ?? r.aplicacion ?? r.application ?? '',
              id: r.mscRoleId ?? r.id ?? 0,
              alias: r.roleName ?? r.alias ?? '',
              descripcion: r.description ?? r.descripcion ?? '',
              tipo: r.inUsoEnRed ?? r.tipo ?? '',
              aplicacion: r.siglasApplic ?? r.aplicacion ?? r.application ?? '',
            } as any)
        );
        this.usuarioSeleccionado = { ...usuario, roles: normalized } as Usuario;
        this.modalLoadingVerRoles = false;
        this.modalService.open(TemplateRef, { centered: true, size: 'xl' });
      },
      error: (err) => {
        this.modalLoadingVerRoles = false;
        console.error('Error obteniendo roles', err);
        Swal.fire({
          title: 'Error',
          text: 'No se pudieron obtener los roles del usuario.',
          icon: 'error',
        });
      },
    });
  }

  openAsociarRolesModal(usuario: Usuario, TemplateRef: TemplateRef<any>) {
  this.modalLoadingVincularRoles = true;
  this.usuarioSeleccionado = usuario;
  this.aplicacionSeleccionadaRolesModal = null;
  this.rolesFiltradosModal = [];
  const msc = usuario.mscUserId;
  this.usuariosService.getRolesUsuario(String(msc)).subscribe({
      next: (assigned: any) => {
        const assignedList = Array.isArray(assigned)
          ? assigned
          : Array.isArray(assigned?.data)
          ? assigned.data
          : [];
        const assignedIds = new Set(
          assignedList.map((ar: any) =>
            String(ar.mscRoleId ?? ar.id ?? ar.roleId ?? '')
          )
        );
        this.rolesService.consultarRoles({}).subscribe({
          next: (resp: any) => {
            const list = Array.isArray(resp?.data)
              ? resp.data
              : Array.isArray(resp)
              ? resp
              : [];
            this.rolesDisponibles = list.map((r: any) => {
              const idVal = r.mscRoleId ?? r.id ?? 0;
              const idStr = String(idVal);
              return {
                mscRoleId: idVal,
                id: idVal,
                roleName: r.roleName ?? r.alias ?? r.rol ?? r.name ?? '',
                alias: r.roleName ?? r.alias ?? r.rol ?? r.name ?? '',
                description: r.description ?? r.descripcion ?? '',
                descripcion: r.description ?? r.descripcion ?? '',
                inUsoEnRed: r.inUsoEnRed ?? r.tipo ?? r.type ?? '',
                tipo: r.inUsoEnRed ?? r.tipo ?? r.type ?? '',
                siglasAplic:
                  r.siglasAplic ?? '',
                aplicacion:
                  r.aplicacion ?? '',
                seleccionado: assignedIds.has(idStr),
              } as RolUsuario & { seleccionado?: boolean };
            });
            console.log('Roles disponibles para asignar:', this.rolesDisponibles);
            this.modalLoadingVincularRoles = false;
            this.modalService.open(TemplateRef, { centered: true, size: 'xl' });
          },
          error: (err) => {
            this.modalLoadingVincularRoles = false;
            console.error('Error cargando roles disponibles', err);
            Swal.fire({
              title: 'Error',
              text: 'No se pudieron cargar los roles disponibles.',
              icon: 'error',
            });
          },
        });
      },
      error: (err) => {
        this.rolesService.consultarRoles({}).subscribe({
          next: (resp: any) => {
            const list = Array.isArray(resp?.data)
              ? resp.data
              : Array.isArray(resp)
              ? resp
              : [];
            this.rolesDisponibles = list.map(
              (r: any) =>
                ({
                  id: r.mscRoleId ?? r.id ?? 0,
                  alias: r.roleName ?? r.alias ?? r.rol ?? r.name ?? '',
                  descripcion: r.description ?? r.descripcion ?? '',
                  tipo: r.inUsoEnRed ?? r.tipo ?? r.type ?? '',
                  aplicacion:
                    r.siglasApplic ?? r.aplicacion ?? r.application ?? '',
                  seleccionado: false,
                } as RolUsuario & { seleccionado?: boolean })
            );
            this.modalLoadingVincularRoles = false;
            this.modalService.open(TemplateRef, { centered: true, size: 'xl' });
          },
          error: (err2) => {
            this.modalLoadingVincularRoles = false;
            console.error('Error cargando roles disponibles', err2);
            Swal.fire({
              title: 'Error',
              text: 'No se pudieron cargar los roles disponibles.',
              icon: 'error',
            });
          },
        });
      },
    });
  }

  guardarAsociacionRoles(usuario: Usuario, modal: any) {
    const rolesSeleccionados = this.rolesDisponibles.filter(
      (r) => (r as any).seleccionado
    );
    console.log('Roles seleccionados para asignar:', rolesSeleccionados);
    const idx = this.usuarios.findIndex((u) => u.userId === usuario.userId);
    // Build payload for backend
    // send as userId but with the value of mscUserId (backend expects userId field)
    const payload = {
      userId: usuario.mscUserId,
      // prefer mscRoleId when present, otherwise fallback to id
      roleIds: rolesSeleccionados.map((r) => (r as any).mscRoleId),
    };

    this.usuariosService.asignarRoles(payload).subscribe({
      next: (resp: any) => {
        // update local user's roles to the selected ones
        if (idx !== -1) {
          this.usuarios[idx].roles = rolesSeleccionados.map((r) => ({
            mscRoleId: r.mscRoleId,
            roleName: r.roleName,
            description: r.description,
            inUsoEnRed: r.inUsoEnRed,
            siglasAplic: r.siglasAplic,
          }));
        }
        this.filtrarUsuarios();
        modal.close();
        this.showSuccessToast(
          'Roles asignados',
          `Se asignaron ${rolesSeleccionados.length} roles.`
        );
      },
      error: (err) => {
        console.error('Error asignando roles', err);
        Swal.fire({
          title: 'Error',
          text: 'No se pudieron asignar los roles.',
          icon: 'error',
        });
      },
    });
  }

  get totalPaginas(): number {
    return Math.ceil(this.usuariosFiltrados.length / this.itemsPorPagina) || 1;
  }

  get paginas(): number[] {
    return Array(this.totalPaginas)
      .fill(0)
      .map((_, i) => i + 1);
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
    this.usuariosFiltrados.forEach((u) => ((u as any).seleccionado = checked));
  }

  isAllSelected(): boolean {
    return (
      this.usuariosFiltrados &&
      this.usuariosFiltrados.length > 0 &&
      this.usuariosFiltrados.every((u) => !!u.seleccionado)
    );
  }

  // UI helpers to manage large selections in the modal
  showAllSelected: boolean = false;
  previewLimit: number = 10;

  selectedCount(): number {
    return this.usuarios.filter((u) => (u as any).seleccionado).length;
  }

  selectedPreview(limit: number = this.previewLimit): Usuario[] {
    return this.usuarios.filter((u) => (u as any).seleccionado).slice(0, limit);
  }

  toggleShowAllSelected() {
    this.showAllSelected = !this.showAllSelected;
  }

  openModificarEstatusModal(template: TemplateRef<any>) {
    // abrir modal mostrando resumen de seleccionados
    const seleccionados = this.usuarios.filter((u) => (u as any).seleccionado);
    if (!seleccionados || seleccionados.length === 0) {
      Swal.fire({
        title: 'Sin selección',
        text: 'Debe seleccionar al menos 1 usuario.',
        icon: 'info',
      });
      return;
    }
    this.nuevoEstatusMasivo = null;
    this.modalService.open(template, { centered: true });
  }

  aplicarModificacionEstatus(modal: any) {
    const seleccionados = this.usuarios.filter((u) => (u as any).seleccionado);
    if (!seleccionados || seleccionados.length === 0) {
      Swal.fire({
        title: 'Sin selección',
        text: 'No hay usuarios seleccionados.',
        icon: 'info',
      });
      return;
    }
    const userIds = seleccionados.map((u) => u.userId);
    const nuevoStatus = Number(this.nuevoEstatusMasivo);
    const token = localStorage.getItem('token');
    if (token === 'fake-token') {
      // Modo offline: modificar localmente y limpiar selección
      seleccionados.forEach((u) => (u.userStatus = nuevoStatus));
      this.usuarios.forEach((u) => ((u as any).seleccionado = false));
      this.filtrarUsuarios();
      modal.close();
      this.showSuccessToast(
        'Estatus actualizado',
        `${seleccionados.length} usuario(s) actualizados.`
      );
    } else {
      this.usuariosService
        .editarEstatusMasivo({ userId: userIds, userStatus: nuevoStatus })
        .subscribe({
          next: (resp: any) => {
            // Actualizar localmente los usuarios seleccionados
            seleccionados.forEach((u) => (u.userStatus = nuevoStatus));
            this.usuarios.forEach((u) => ((u as any).seleccionado = false));
            this.filtrarUsuarios();
            modal.close();
            this.showSuccessToast(
              'Estatus actualizado',
              `${seleccionados.length} usuario(s) actualizados.`
            );
          },
          error: (err: any) => {
            Swal.fire({
              title: 'Error',
              text: 'No se pudo actualizar el estatus masivo.',
              icon: 'error',
            });
          },
        });
    }
  }

  salir() {
    console.log('Salir');
  }
}
