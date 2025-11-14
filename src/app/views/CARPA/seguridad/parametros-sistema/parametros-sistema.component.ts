import { Component, OnInit, TemplateRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import Swal from 'sweetalert2';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CriteriosService, SystemParameters, SystemParameterSetting } from 'src/app/services/configuracion/criterios.service';

@Component({
  selector: 'app-parametros-sistema',
  templateUrl: './parametros-sistema.component.html',
  styleUrls: ['./parametros-sistema.component.scss']
})
export class ParametrosSistemaComponent implements OnInit {

  // The remote system parameters object
  systemParameters: SystemParameters | null = null;
  loading: boolean = false;

  // Local editable copy of settings
  settings: SystemParameterSetting[] = [];

  settingSeleccionado: SystemParameterSetting | null = null;
  // store original key when opening edit modal so we can locate the correct array index
  private settingOriginalKey: string | null = null;
  nuevoSetting: SystemParameterSetting = { key: '', value: '', type: 'string', description: '', active: true } as SystemParameterSetting;

  // validation flags for template-driven forms
  submittedEdit: boolean = false;
  submittedAdd: boolean = false;
  editValuePatternError: boolean = false;
  addValuePatternError: boolean = false;

  // busqueda y paginacion
  searchTerm: string = '';
  page: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;
  settingsFiltrados: SystemParameterSetting[] = [];
  settingsPaginados: SystemParameterSetting[] = [];

  // hardcoded payload fields
  private readonly FIXED_ID = '69139bf2cc25f4c89a2bbe3f';
  private readonly FIXED_SYSTEM = 'CARPA';
  private readonly FIXED_PROFILE = 'criterios';

  constructor(
    private modalService: NgbModal,
    private criteriosService: CriteriosService
  ) { }

  ngOnInit(): void {
    // Subscribe to live cambios from the service so UI refreshes when other parts update
    this.criteriosService.criterios$.subscribe((v) => {
      if (v) {
        this.systemParameters = v;
        this.settings = v.settings ? this.parseIncomingSettings(v.settings) : [];
        this.filtrarParametros();

      }
    });

    this.loadCriterios();
  }

  /**
   * Convert server settings into UI-friendly objects.
   * If a setting has a numeric value in the {$numberInt: '...'} form, expose its inner string/number for editing.
   */
  private parseIncomingSettings(settings: SystemParameterSetting[]): SystemParameterSetting[] {
    return (settings || []).map(s => {
      const copy: any = { ...s };
      if (copy && copy.type === 'number' && copy.value && typeof copy.value === 'object' && '$numberInt' in copy.value) {
        // expose as plain string for inputs; keep as string to avoid number coercion issues in form
        copy.value = String(copy.value['$numberInt']);
      }
      return copy as SystemParameterSetting;
    });
  }

  /**
   * Convert a UI setting to the server shape. For numeric types, wrap value in {$numberInt: '...'}.
   */
  private normalizeSettingForServer(s: SystemParameterSetting): any {
    const out: any = { ...s };
    if (out.type === 'number') {
      // ensure it's a stringified integer inside $numberInt
      const num = out.value === null || out.value === undefined ? '' : String(out.value);
      // keep empty as empty string if necessary; otherwise coerce to integer string
      out.value = { $numberInt: num };
    } else {
      out.value = out.value;
    }
    return out;
  }

  private loadCriterios(): void {
    this.loading = true;
    // search only the fixed profile via POST payload so backend returns only 'criterios'
    const payload = { system: this.FIXED_SYSTEM, profile: this.FIXED_PROFILE };
    this.criteriosService.buscar(payload).subscribe({
      next: (resp: any) => {
        this.loading = false;
        let found: SystemParameters | null = null;
        if (Array.isArray(resp)) {
          // backend returned array: pick the exact profile entry
          found = resp.find((r: SystemParameters) => r.system === this.FIXED_SYSTEM && r.profile === this.FIXED_PROFILE) || null;
        } else {
          found = resp as SystemParameters;
        }
        if (!found) {
          found = this.criteriosService.currentValue;
        }
  this.systemParameters = found;
  this.settings = found?.settings ? this.parseIncomingSettings(found.settings) : [];
        this.filtrarParametros();
      },
      error: (err) => {
        this.loading = false;
        console.error('Error cargando criterios', err);
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar los criterios del sistema.' });
      }
    });
  }

  openEliminarModal(setting: SystemParameterSetting, template: TemplateRef<any>) {
    this.settingSeleccionado = setting;
    this.modalService.open(template, { centered: true });
  }

  openEditarModal(setting: SystemParameterSetting, template: TemplateRef<any>) {
    this.settingSeleccionado = { ...setting } as SystemParameterSetting;
    this.submittedEdit = false;
    this.editValuePatternError = false;
    // remember original key to find the correct item even if user edits the key field
    this.settingOriginalKey = setting.key;
    this.modalService.open(template, { centered: true });
  }

  openAddParametroModal(template: TemplateRef<any>) {
    this.nuevoSetting = { key: '', value: '', type: 'string', description: '', active: true } as SystemParameterSetting;
    this.submittedAdd = false;
    this.addValuePatternError = false;
    this.modalService.open(template, { centered: true });
  }

  eliminarParametro(setting: SystemParameterSetting, modal: any) {
    this.settings = this.settings.filter(p => p.key !== setting.key);
    // persist and close the modal only when server confirms
    this.persistSettings('editar', undefined, modal);
    this.filtrarParametros();
  }

  guardarEdicionParametro(form: NgForm, modal: any) {
    this.submittedEdit = true;
    this.editValuePatternError = false;
    if (!form || form.invalid || !this.settingSeleccionado) {
      return;
    }
    // if type is number, ensure value is numeric
    if (this.settingSeleccionado.type === 'number') {
      if (this.settingSeleccionado.value === null || this.settingSeleccionado.value === undefined || this.settingSeleccionado.value.toString().trim() === '') {
        return;
      }
      if (isNaN(Number(this.settingSeleccionado.value))) {
        this.editValuePatternError = true;
        return;
      }
    }

    // Find the index using the original key (in case the user edited the key in the modal)
    const lookupKey = this.settingOriginalKey || this.settingSeleccionado!.key;
    const idx = this.settings.findIndex(p => p.key === lookupKey);
    if (idx !== -1) {
      this.settings[idx] = { ...this.settingSeleccionado } as SystemParameterSetting;
    }
    // reset original key tracking
    this.settingOriginalKey = null;
  this.persistSettings('editar', undefined, modal);
  this.filtrarParametros();
  }

  addParametro(form: NgForm, modal: any) {
    this.submittedAdd = true;
    this.addValuePatternError = false;
    if (!form || form.invalid) return;
    if (this.nuevoSetting.type === 'number') {
      if (this.nuevoSetting.value === null || this.nuevoSetting.value === undefined || this.nuevoSetting.value.toString().trim() === '') return;
      if (isNaN(Number(this.nuevoSetting.value))) {
        this.addValuePatternError = true;
        return;
      }
    }
    const newSetting = { ...this.nuevoSetting } as SystemParameterSetting;
    const idx = this.settings.findIndex(s => s.key === newSetting.key);
    // If key already exists, treat as an edit (send full settings for edit).
    if (idx !== -1) {
      this.settings[idx] = { ...newSetting };
      // Persist as edit (server will replace/update the setting) and close modal on success
      this.persistSettings('editar', undefined, modal);
    } else {
      // Persist only the single new setting to avoid sending the entire settings array and close modal on success
      this.persistSettings('crear', newSetting, modal);
    }
    // filtering/pagination will be updated when server response arrives and settings are replaced
    // close modal will occur after successful response inside persistSettings
  }

  confirmarEliminarParametro(setting: SystemParameterSetting) {
    Swal.fire({
      title: `¿Desea eliminar el parámetro "${setting.key}"?`,
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.settings = this.settings.filter(p => p.key !== setting.key);
        this.persistSettings('editar');
        this.filtrarParametros();
        Swal.fire({
          title: 'Eliminado',
          text: `El parámetro "${setting.key}" ha sido eliminado.`,
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
  }

  // ---- Busqueda y paginacion ----
  filtrarParametros(): void {
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.trim().toLowerCase();
      this.settingsFiltrados = this.settings.filter(p =>
        (p.key || '').toString().toLowerCase().includes(term) ||
        (p.value || '').toString().toLowerCase().includes(term) ||
        (p.description || '').toString().toLowerCase().includes(term)
      );
    } else {
      this.settingsFiltrados = [...this.settings];
    }
    this.page = 1;
    this.actualizarPaginacion();
  }

  actualizarPaginacion(): void {
    this.totalPages = Math.max(1, Math.ceil(this.settingsFiltrados.length / this.pageSize));
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.settingsPaginados = this.settingsFiltrados.slice(start, end);
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

  salir() {
  }

  /**
   * Persist settings to server.
   * - For 'crear' mode we send only the single new setting in the settings array to avoid duplicating or re-sending the whole profile.
   * - For 'editar' mode we send the full settings array (server-side replace/update semantics expected).
   */
  private persistSettings(mode: 'crear'|'editar', singleSetting?: SystemParameterSetting, modal?: any) {
    this.loading = true;

    if (mode === 'crear') {
      const payload: SystemParameters = {
        system: this.FIXED_SYSTEM,
        profile: this.FIXED_PROFILE,
        settings: singleSetting ? [this.normalizeSettingForServer(singleSetting)] : []
      };
      this.criteriosService.crearCriterios(payload).subscribe({
        next: (resp) => {
            // Some backends return only the created item instead of the full profile.
            // If resp contains full settings, use it; otherwise, refresh via buscar to obtain canonical profile.
            const hasSettings = resp && Array.isArray(resp.settings) && resp.settings.length > 0;
            if (hasSettings) {
              this.loading = false;
              this.systemParameters = resp;
              this.settings = resp?.settings ? this.parseIncomingSettings(resp.settings) : [];
              this.filtrarParametros();
              Swal.fire({ icon: 'success', title: 'Éxito', text: 'Configuración agregada correctamente', toast: true, position: 'top-start', timer: 2000, showConfirmButton: false });
              try { if (modal && modal.close) modal.close(); } catch (e) { }
            } else {
              // refresh canonical profile from server
              this.criteriosService.buscar({ system: this.FIXED_SYSTEM, profile: this.FIXED_PROFILE }).subscribe({
                next: (r: any) => {
                  this.loading = false;
                  let found: SystemParameters | null = null;
                  if (Array.isArray(r)) {
                    found = r.find((x: SystemParameters) => x.system === this.FIXED_SYSTEM && x.profile === this.FIXED_PROFILE) || null;
                  } else {
                    found = r as SystemParameters;
                  }
                  this.systemParameters = found;
                  this.settings = found?.settings ? this.parseIncomingSettings(found.settings) : [];
                  this.filtrarParametros();
                  Swal.fire({ icon: 'success', title: 'Éxito', text: 'Configuración agregada correctamente', toast: true, position: 'top-start', timer: 2000, showConfirmButton: false });
                  try { if (modal && modal.close) modal.close(); } catch (e) { }
                },
                error: (err) => {
                  this.loading = false;
                  console.error('Error refrescando criterios después de crear', err);
                  Swal.fire({ icon: 'warning', title: 'Atención', text: 'Se creó el criterio pero no se pudo refrescar la lista automáticamente. Por favor recargue la página.' });
                }
              });
            }
        },
        error: (err) => {
          this.loading = false;
          console.error('Error creando criterios', err);
          Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo crear el criterio' });
        }
      });
    } else {
      // editar: send full settings array (server expected replace/update semantics)
      const payload: SystemParameters = {
        id: this.FIXED_ID,
        system: this.FIXED_SYSTEM,
        profile: this.FIXED_PROFILE,
        settings: this.settings ? this.settings.map(s => this.normalizeSettingForServer(s)) : []
      };
      this.criteriosService.editarCriterios(payload).subscribe({
        next: (resp) => {
          // similar handling to crear: if server returns full settings, use it; otherwise refresh canonical profile
          const hasSettings = resp && Array.isArray(resp.settings) && resp.settings.length > 0;
          if (hasSettings) {
            this.loading = false;
            this.systemParameters = resp;
            this.settings = resp?.settings ? this.parseIncomingSettings(resp.settings) : [];
            this.filtrarParametros();
            Swal.fire({ icon: 'success', title: 'Éxito', text: 'Configuración persistida correctamente', toast: true, position: 'top-start', timer: 2000, showConfirmButton: false });
            try { if (modal && modal.close) modal.close(); } catch (e) { }
          } else {
            // fetch canonical profile to ensure UI shows server state
            this.criteriosService.buscar({ system: this.FIXED_SYSTEM, profile: this.FIXED_PROFILE }).subscribe({
              next: (r: any) => {
                this.loading = false;
                let found: SystemParameters | null = null;
                if (Array.isArray(r)) {
                  found = r.find((x: SystemParameters) => x.system === this.FIXED_SYSTEM && x.profile === this.FIXED_PROFILE) || null;
                } else {
                  found = r as SystemParameters;
                }
                this.systemParameters = found;
                this.settings = found?.settings ? this.parseIncomingSettings(found.settings) : [];
                this.filtrarParametros();
                Swal.fire({ icon: 'success', title: 'Éxito', text: 'Configuración persistida correctamente', toast: true, position: 'top-start', timer: 2000, showConfirmButton: false });
                try { if (modal && modal.close) modal.close(); } catch (e) { }
              },
              error: (err) => {
                this.loading = false;
                console.error('Error refrescando criterios después de editar', err);
                Swal.fire({ icon: 'warning', title: 'Atención', text: 'Se actualizó el criterio pero no se pudo refrescar la lista automáticamente. Por favor recargue la página.' });
              }
            });
          }
        },
        error: (err) => {
          this.loading = false;
          console.error('Error guardando criterios', err);
          Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo guardar la configuración' });
        }
      });
    }
  }
}
