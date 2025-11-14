import { Component, OnInit, TemplateRef, OnDestroy } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { ConexionesService, ConexionSetting } from 'src/app/services/configuracion/conexiones.service';
import { AplicacionesService, Aplicacion } from 'src/app/services/aplicaciones-services/aplicaciones.service';

interface RegistroBCV {
  sistema: string;
  modulo?: string;
  usuario: string;
  claveReal: string;
  verClave?: boolean;
}

@Component({
  selector: 'app-servicios-web-bcv',
  templateUrl: './servicios-web-bcv.component.html',
  styleUrls: ['./servicios-web-bcv.component.scss']
})
export class ServiciosWebBcvComponent implements OnInit {

  registros: RegistroBCV[] = [];

  nuevoRegistro: any = {};
  submittedAdd: boolean = false;
  submittedEdit: boolean = false;
  showEditarClave: boolean = false;
  showEditarRepite: boolean = false;

  // estados para mostrar/ocultar claves en el modal de agregar
  nuevoMostrarClave: boolean = false;
  nuevoMostrarRepetirClave: boolean = false;

  // busqueda y paginacion
  searchTerm: string = '';
  page: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;
  registrosFiltrados: RegistroBCV[] = [];
  registrosPaginados: RegistroBCV[] = [];

  loading: boolean = false;
  // fixed id used by backend for conexiones profile (match parametros-sistema behavior)
  private readonly FIXED_ID = '69160daaa843e48dafd0d83d';

  aplicaciones: Aplicacion[] = [];
  private conexionesSub: any = null;

  constructor(private modalService: NgbModal, private conexionesService: ConexionesService, private aplicacionesService: AplicacionesService) { }

  registroSeleccionado: RegistroBCV | null = null;

  editarRegistroSeleccionado: any = {};

  ngOnInit(): void {
    this.loadConexiones();
    this.loadAplicaciones();
    // subscribe to cambios in conexiones so the table updates reactively
    this.conexionesSub = this.conexionesService.conexiones$.subscribe((resp: any) => {
      if (!resp) return;
      const found = resp;
      const settings: any[] = found?.settings || [];
      if (settings.length > 0 && settings[0]) {
        // Two possible server formats we handle:
        // A) Each setting is an object with { key, user, password } — common now.
        // B) Flattened key/value entries (old format) where we need to group entries in chunks.
        if ('user' in settings[0] || 'password' in settings[0]) {
          // Format A: direct entries per registro
          this.registros = settings.map(s => ({
            sistema: s.system || found.system || 'CARPA',
            modulo: s.key || s.modulo || '',
            usuario: s.user || s.value || '',
            claveReal: s.password || s.value || ''
          } as RegistroBCV));
        } else if ('key' in settings[0]) {
          // Format B: flattened key/value entries grouped in chunks (legacy)
          const reconstructed: RegistroBCV[] = [];
          const chunkSize = 3;
          for (let i = 0; i < settings.length; i += chunkSize) {
            const chunk = settings.slice(i, i + chunkSize);
            const moduloEntry = chunk.find(c => (c.key || '').toString().toLowerCase().includes('modulo')) || chunk[0];
            const userEntry = chunk.find(c => (c.key || '').toString().toLowerCase().includes('user')) || chunk[1];
            const passEntry = chunk.find(c => (c.key || '').toString().toLowerCase().includes('pass')) || chunk[2];
            reconstructed.push({
              sistema: found.system || '',
              modulo: moduloEntry?.value || '',
              usuario: userEntry?.value || '',
              claveReal: passEntry?.value || ''
            });
          }
          this.registros = reconstructed;
        } else {
          // Fallback: try to map by common names
          const typed: ConexionSetting[] = settings as ConexionSetting[];
          this.registros = typed.map(s => ({ sistema: s.system || 'CARPA', modulo: (s as any).modulo || (s as any).key || '', usuario: s.user || '', claveReal: s.password || '' } as RegistroBCV));
        }
      } else {
        this.registros = [];
      }
      this.filtrarRegistros();
    });
  }

  ngOnDestroy(): void {
    try { if (this.conexionesSub && this.conexionesSub.unsubscribe) this.conexionesSub.unsubscribe(); } catch (e) { }
  }

  private loadAplicaciones() {
    this.aplicacionesService.loadAplicaciones().subscribe({
      next: (apps: Aplicacion[]) => {
        this.aplicaciones = apps || [];
      },
      error: (err) => {
        console.error('Error cargando aplicaciones', err);
        // fallback: keep aplicaciones empty - UI will show no options
      }
    });
  }

  private loadConexiones() {
    this.loading = true;
    const payload = { system: 'CARPA', profile: 'conexiones' };
    this.conexionesService.buscar(payload).subscribe({
      next: (resp: any) => {
        let found: any = null;
        if (Array.isArray(resp)) {
          found = resp.find((r: any) => r.system === 'CARPA' && r.profile === 'conexiones') || null;
        } else {
          found = resp;
        }
        const settings: any[] = found?.settings || [];
        // support server formats. Common possibilities:
        // A) settings: [{ key, user, password, system? }, ...]  <- current format
        // B) settings: [{ system, modulo, user, password }, ...] <- typed format
        // C) flattened key/value entries: [{ key, value, ... }, ...] grouped in chunks (legacy)
        if (settings.length > 0 && (('user' in settings[0]) || ('password' in settings[0]) || ('key' in settings[0] && 'user' in settings[0]))) {
          // Format A: each setting already has user/password and a key (map directly)
          this.registros = settings.map(s => ({
            sistema: s.system || found.system || 'CARPA',
            modulo: s.key || s.modulo || '',
            usuario: s.user || '',
            claveReal: s.password || ''
          } as RegistroBCV));
        } else if (settings.length > 0 && settings[0] && 'key' in settings[0]) {
          // Format C: flattened key/value entries grouped in chunks (legacy)
          const reconstructed: RegistroBCV[] = [];
          const chunkSize = 3;
          for (let i = 0; i < settings.length; i += chunkSize) {
            const chunk = settings.slice(i, i + chunkSize);
            const moduloEntry = chunk.find(c => (c.key || '').toString().toLowerCase().includes('modulo')) || chunk[0];
            const userEntry = chunk.find(c => (c.key || '').toString().toLowerCase().includes('user')) || chunk[1];
            const passEntry = chunk.find(c => (c.key || '').toString().toLowerCase().includes('pass')) || chunk[2];
            reconstructed.push({
              sistema: found.system || '',
              modulo: moduloEntry?.value || '',
              usuario: userEntry?.value || '',
              claveReal: passEntry?.value || ''
            });
          }
          this.registros = reconstructed;
        } else {
          // Fallback typed format B
          const typed: ConexionSetting[] = settings as ConexionSetting[];
          this.registros = typed.map(s => ({ sistema: s.system || 'CARPA', modulo: s.modulo || (s as any).key || '', usuario: s.user, claveReal: s.password } as RegistroBCV));
        }
  this.filtrarRegistros();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando conexiones', err);
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar las conexiones del sistema.' });
        this.loading = false;
      }
    });
  }

  openAddModal(content: TemplateRef<any>) {
    // inicializar campos vacíos para añadir un nuevo registro
    // default to empty so the 'Seleccione' option is shown and required validation applies
    this.nuevoRegistro = { sistema: '', modulo: '', usuario: '', clave: '', repetirClave: '' };
    // resetear estados de visibilidad de clave
    this.nuevoMostrarClave = false;
    this.nuevoMostrarRepetirClave = false;
    this.modalService.open(content, { centered: true });
  }

  toggleNuevoMostrarClave(which: 'clave' | 'repetir') {
    if (which === 'clave') this.nuevoMostrarClave = !this.nuevoMostrarClave;
    else this.nuevoMostrarRepetirClave = !this.nuevoMostrarRepetirClave;
  }

  passwordMismatchAdd(): boolean {
    return !!((this.nuevoRegistro?.clave || this.nuevoRegistro?.repetirClave) && (this.nuevoRegistro.clave !== this.nuevoRegistro.repetirClave));
  }

  passwordMismatchEdit(): boolean {
    return !!((this.editarRegistroSeleccionado?.clave || this.editarRegistroSeleccionado?.repetirClave) && (this.editarRegistroSeleccionado.clave !== this.editarRegistroSeleccionado.repetirClave));
  }

  guardarRegistro(modal: any, form?: NgForm) {
    this.submittedAdd = true;
    // if form provided and invalid, block (form is provided via template's registroForm)
    if (form && form.invalid) return;
    if (this.nuevoRegistro.clave !== this.nuevoRegistro.repetirClave) {
      // leave UI to display the validation message
      return;
    }

    const newRegistro: RegistroBCV = {
      sistema: this.nuevoRegistro.sistema,
      modulo: this.nuevoRegistro.modulo,
      usuario: this.nuevoRegistro.usuario,
      claveReal: this.nuevoRegistro.clave
    };

  // Do not update the UI optimistically here; wait for server response and refresh from backend

    // Persist: build payload from current registros and send to backend
    const current = this.conexionesService.currentValue;
    // Build merged settings: preserve existing slots from server where user didn't provide a new entry
    const existingSettings: any[] = current?.settings || [];
    const mergedSettings = existingSettings.length > 0
      ? existingSettings.map((orig: any, idx: number) => {
          const r = this.registros[idx];
          if (r && (r.modulo || r.usuario || r.claveReal)) {
            return { system: r.sistema || 'CARPA', modulo: r.modulo, user: r.usuario, password: r.claveReal };
          }
          // keep original if it already has connection fields, otherwise keep empty object
          if (orig && (orig.modulo || orig.user || orig.password || orig.key || orig.value)) {
            return { system: orig.system || 'CARPA', modulo: orig.modulo || orig.key, user: orig.user || orig.value, password: orig.password || '' };
          }
          return {};
        })
      : this.registros.map(r => ({ system: r.sistema || 'CARPA', modulo: r.modulo, user: r.usuario, password: r.claveReal }));

    // For the add modal we always call the crear endpoint (create new profile or create entries)
    // Only send the single new record in settings (backend expects a one-item array for create).
    // Use the server's current shape: { system, key, user, password }
    const newSetting = { system: newRegistro.sistema || 'CARPA', key: newRegistro.modulo, user: newRegistro.usuario, password: newRegistro.claveReal };
    const createPayload: any = {
      system: 'CARPA',
      profile: 'conexiones',
      settings: [ newSetting ]
    };

    // log payload for debugging (inspect in browser devtools console)
    console.debug('Enviar payload conexiones (crear):', createPayload);

    const op$ = this.conexionesService.crearConexiones(createPayload);
    this.loading = true;
    op$.subscribe({
      next: (resp: any) => {
        // refresh from backend so the service/subject contains canonical data
        this.conexionesService.buscar({ system: 'CARPA', profile: 'conexiones' }).subscribe({
          next: () => {
            this.loading = false;
            modal.close();
            Swal.fire({ icon: 'success', title: 'Guardado', text: 'Conexión agregada correctamente', position: 'top-end', toast:true, timerProgressBar:true, timer: 1500, showConfirmButton: false });
          },
          error: (err) => {
            this.loading = false;
            console.error('Error refrescando conexiones después de crear', err);
          }
        });
      },
      error: (err) => {
        this.loading = false;
        console.error('Error guardando conexiones', err);
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo guardar la conexión en el servidor.' });
      }
    });
  }

  openEliminarModal(registro: RegistroBCV, template: TemplateRef<any>) {
    this.registroSeleccionado = registro;
    this.modalService.open(template, { centered: true });
  }

  eliminarRegistroConfirmado(modal: any) {
    if (this.registroSeleccionado) {
      this.registros = this.registros.filter(r => r !== this.registroSeleccionado);
      this.registroSeleccionado = null;
      // refrescar listado y paginación
      this.filtrarRegistros();
      modal.close();
    }
  }

  openEditarModal(registro: RegistroBCV, template: TemplateRef<any>) {
    this.submittedEdit = false;
    this.editarRegistroSeleccionado = {
      sistema: registro.sistema,
      modulo: registro.modulo,
      usuario: registro.usuario,
      clave: '',
      repetirClave: ''
    };
    this.registroSeleccionado = registro;
    this.modalService.open(template, { centered: true });
  }

  confirmarEliminarRegistro(registro: RegistroBCV) {
    Swal.fire({
      title: `¿Desea eliminar el registro "${registro.sistema}"?`,
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.registros = this.registros.filter(r => r !== registro);
        this.filtrarRegistros();
        Swal.fire({
          title: 'Eliminado',
          text: `El registro "${registro.sistema}" ha sido eliminado.`,
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
  }

  guardarEdicionRegistro(form: NgForm, modal: any) {
    this.submittedEdit = true;
    if (form && form.invalid) return;
    // Guardar cambios en el registro seleccionado
    if (this.editarRegistroSeleccionado && this.registroSeleccionado) {
      // Si se ingresó una nueva clave, actualizamos claveReal solo si coinciden
      if (this.editarRegistroSeleccionado.clave || this.editarRegistroSeleccionado.repetirClave) {
        if (this.editarRegistroSeleccionado.clave !== this.editarRegistroSeleccionado.repetirClave) {
          // leave UI to display the validation message
          return;
        }
        this.registroSeleccionado.claveReal = this.editarRegistroSeleccionado.clave;
      }
      // actualizar campos modificables
      this.registroSeleccionado.usuario = this.editarRegistroSeleccionado.usuario;
      this.registroSeleccionado.modulo = this.editarRegistroSeleccionado.modulo;

      // Persist changes: only send the single setting corresponding to the edited key (module)
      const current = this.conexionesService.currentValue;

      // Build payload with connection profile id and a single settings entry for the edited key.
      // Build profile id as a plain string (supporting id, _id or {_id:{$oid:...}} shapes)
      let profileId = this.FIXED_ID;
      if (current) {
        if (typeof (current as any).id === 'string') {
          profileId = (current as any).id;
        } else if ((current as any)._id) {
          const raw = (current as any)._id;
          profileId = typeof raw === 'string' ? raw : (raw && raw.$oid ? raw.$oid : this.FIXED_ID);
        }
      }

      const payload: any = {
        id: profileId,
        settings: [
          {
            system: this.registroSeleccionado?.sistema || (current?.system || 'CARPA'),
            key: this.registroSeleccionado?.modulo,
            user: this.registroSeleccionado?.usuario,
            password: this.registroSeleccionado?.claveReal
          }
        ]
      };

      console.debug('Enviar payload conexiones (editar single key):', payload);

      this.loading = true;
      this.conexionesService.editarConexiones(payload).subscribe({
        next: (resp: any) => {
          // refresh from backend so the canonical state is emitted
          this.conexionesService.buscar({ system: 'CARPA', profile: 'conexiones' }).subscribe({
            next: () => {
              this.loading = false;
              modal.close();
              Swal.fire({ icon: 'success', title: 'Guardado', text: 'Conexión actualizada correctamente', position: 'top-end', toast:true, timerProgressBar:true, timer: 1500, showConfirmButton: false });
            },
            error: (err) => {
              this.loading = false;
              console.error('Error refrescando conexiones después de editar', err);
            }
          });
        },
        error: (err) => {
          this.loading = false;
          console.error('Error actualizando conexiones', err);
          Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo actualizar la conexión en el servidor.' });
        }
      });
    }
  }

  toggleVerClave(registro: RegistroBCV) {
    registro.verClave = !registro.verClave;
  }

  getClaveOculta(clave: string): string {
  return clave ? '*'.repeat(clave.length) : '';
  }

  salir() {
    window.history.back();
  }

  // ---- Busqueda y paginacion ----
  filtrarRegistros(): void {
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.trim().toLowerCase();
      this.registrosFiltrados = this.registros.filter(r =>
        (r.sistema || '').toLowerCase().includes(term) ||
        (r.usuario || '').toLowerCase().includes(term)
      );
    } else {
      this.registrosFiltrados = [...this.registros];
    }
    this.page = 1;
    this.actualizarPaginacion();
  }

  actualizarPaginacion(): void {
    this.totalPages = Math.max(1, Math.ceil(this.registrosFiltrados.length / this.pageSize));
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.registrosPaginados = this.registrosFiltrados.slice(start, end);
  }

  cambiarPagina(nuevaPagina: number): void {
    if (nuevaPagina < 1 || nuevaPagina > this.totalPages) return;
    this.page = nuevaPagina;
    this.actualizarPaginacion();
  }

  cambiarPageSize(nuevoSize: number): void {
    this.pageSize = nuevoSize;
    this.page = 1;
    this.actualizarPaginacion();
  }
}
