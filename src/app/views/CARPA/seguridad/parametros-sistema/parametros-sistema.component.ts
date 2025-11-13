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
        this.settings = v.settings ? [...v.settings] : [];
        this.filtrarParametros();

      }
    });

    this.loadCriterios();
  }

  private loadCriterios(): void {
    this.loading = true;
    // handle possible response shapes: an object or an array of profiles
    this.criteriosService.refresh().subscribe({
      next: (resp: any) => {
        this.loading = false;
        let found: SystemParameters | null = null;
        if (Array.isArray(resp)) {
          found = resp.find((r: SystemParameters) => r.system === this.FIXED_SYSTEM && r.profile === this.FIXED_PROFILE) || null;
        } else {
          // sometimes backend returns object directly
          found = resp as SystemParameters;
        }
        if (!found) {
          // if nothing found, try currentValue from service
          found = this.criteriosService.currentValue;
        }
        this.systemParameters = found;
        this.settings = found?.settings ? [...found.settings] : [];
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
    this.persistSettings('editar');
    this.filtrarParametros();
    modal.close();
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

    const idx = this.settings.findIndex(p => p.key === this.settingSeleccionado!.key);
    if (idx !== -1) {
      this.settings[idx] = { ...this.settingSeleccionado } as SystemParameterSetting;
    }
    this.persistSettings('editar');
    this.filtrarParametros();
    modal.close();
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
    const idx = this.settings.findIndex(s => s.key === this.nuevoSetting.key);
    if (idx !== -1) this.settings[idx] = { ...this.nuevoSetting };
    else this.settings.push({ ...this.nuevoSetting });
    this.persistSettings('crear');
    this.filtrarParametros();
    modal.close();
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

  private persistSettings(mode: 'crear'|'editar') {
    const payload: SystemParameters = {
      id: this.FIXED_ID,
      system: this.FIXED_SYSTEM,
      profile: this.FIXED_PROFILE,
      settings: this.settings
    };
    this.loading = true;
    const op$ = mode === 'crear' ? this.criteriosService.crearCriterios(payload) : this.criteriosService.editarCriterios(payload);
    op$.subscribe({
      next: (resp) => {
        this.loading = false;
        this.systemParameters = resp;
        this.settings = resp?.settings ? [...resp.settings] : [];
        Swal.fire({ icon: 'success', title: 'Éxito', text: 'Configuración persistida correctamente', toast: true, position: 'top-start', timer: 2000, showConfirmButton: false });
      },
      error: (err) => {
        this.loading = false;
        console.error('Error guardando criterios', err);
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo guardar la configuración' });
      }
    });
  }
}
