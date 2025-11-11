import { Component, OnInit, ViewChild } from '@angular/core';
import Swal from 'sweetalert2';
import { FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { LoginService } from 'src/app/services/login.service'; 
import { SessionSyncService } from 'src/app/services/session-sync.service'; 

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  
  @ViewChild ('loginForm') loginNgForm: NgForm
  
  returnUrl: any;
  showPassword = false;
  loginForm: FormGroup;
  loading = false;
  // track submit attempts to show validation messages
  submitted = false;
  // Sigla de la aplicación (usar aquí y al enviar el payload)
  siglasApplic: string = 'CARPA';
  
  constructor(
    private router: Router, 
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private loginService: LoginService,
    private sessionSync: SessionSyncService
  ) { }
  
  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      codUsuario:['', [Validators.required, Validators.pattern(/^(?:NM|CT|TP).*/i)]],
      password: ['', [Validators.required]]

    })
  // get return url from route parameters or default to '/inicio'
  this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/inicio';
  }

    private promptUpdatePassword(codUsuario: string): void {
    Swal.fire({
      title: 'Contraseña expirada',
      html:
        `<input type="password" id="swal-input1" class="swal2-input" placeholder="Nueva contraseña">
         <input type="password" id="swal-input2" class="swal2-input" placeholder="Confirmar nueva contraseña">
         <input type="number" id="swal-input3" class="swal2-input" placeholder="Días de validez (ej. 90)" min="1" value="90">
         <small>La contraseña debe tener al menos 6 caracteres. passwordDays debe ser >= 1.</small>`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Actualizar',
      preConfirm: () => {
        const p1 = (document.getElementById('swal-input1') as HTMLInputElement)?.value || '';
        const p2 = (document.getElementById('swal-input2') as HTMLInputElement)?.value || '';
        const daysRaw = (document.getElementById('swal-input3') as HTMLInputElement)?.value || '';
        const days = Number(daysRaw) || 0;
        if (!p1 || p1.length < 6) {
          Swal.showValidationMessage('La contraseña debe tener al menos 6 caracteres');
          return;
        }
        if (p1 !== p2) {
          Swal.showValidationMessage('Las contraseñas no coinciden');
          return;
        }
        if (!Number.isInteger(days) || days < 1) {
          Swal.showValidationMessage('passwordDays debe ser un número entero mayor o igual a 1');
          return;
        }
        return { newPassword: p1, passwordDays: days };
      }
    }).then((result) => {
      if (result && (result as any).value && (result as any).value.newPassword) {
        const newPass = (result as any).value.newPassword;
        const passwordDays = (result as any).value.passwordDays;
        this.loading = true;
        // DTO esperado: { userId, password, passwordDays }
        this.loginService.changePassword({
          userId: codUsuario,
          password: newPass,
          passwordDays: passwordDays
        }).subscribe({
          next: () => {
            this.loading = false;
            Swal.fire({
              icon: 'success',
              title: 'Contraseña actualizada',
              text: 'Tu contraseña fue actualizada correctamente. Intentando iniciar sesión...',
              toast: true,
              position: 'top-start',
              showConfirmButton: false,
              timer: 2500,
              timerProgressBar: true,
            });
            // reintentar login con la nueva contraseña
            this.loginForm.controls['password'].setValue(newPass);
            setTimeout(() => this.submit(), 300);
          },
          error: (err: any) => {
            this.loading = false;
            console.error('Error al actualizar contraseña', err);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: err && (err.mensaje || err.error?.mensaje || err.message) ? (err.mensaje || err.error?.mensaje || err.message) : 'No se pudo actualizar la contraseña',
              toast: true,
              position: 'top-start',
              showConfirmButton: false,
              timer: 4000,
              timerProgressBar: true,
            });
          }
        });
      }
    });
  }
  
  togglePassword() {
    this.showPassword = !this.showPassword;
  }
  submit(event?: Event): void {
    if (event && typeof event.preventDefault === 'function') event.preventDefault();
    this.submitted = true;
    // prevent submit when form invalid
    if (this.loginForm.invalid) {
      this.loading = false;
      return;
    }
    this.loading = true;

    const { codUsuario, password } = this.loginForm.value;
    const payload = { codUsuario, password, siglasApplic: this.siglasApplic, bypassLdap: true };

    this.clearSessionFlags();

    this.loginService.validarUsuario(payload).subscribe({
      next: (response: any) => this.handleLoginSuccess(response),
      error: (error: any) => this.handleLoginError(error)
    });
  }

  // Helpers extracted for readability and easier unit testing
  private clearSessionFlags(): void {
    try {
      console.log('Clearing previous session flags prior to login attempt');
      // Use sessionStorage so session data is isolated per tab/window
      sessionStorage.removeItem('isLoggedin');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('refreshToken');
      sessionStorage.removeItem('usuarioActual');
    } catch (e) {
      // ignore storage errors
    }
  }

  private handleLoginSuccess(response: any): void {
    if (response && response.token) {
      // Store tokens in sessionStorage to avoid cross-tab sharing
      sessionStorage.setItem('token', response.token);
    }
    if (response && response.refreshToken) {
      sessionStorage.setItem('refreshToken', response.refreshToken);
    }

    const usuarioNombre = this.buildDisplayName(response);
    if (usuarioNombre) {
      sessionStorage.setItem('usuarioActual', usuarioNombre);
    }

    // Only navigate if service marked session or token exists
  const serviceMarked = sessionStorage.getItem('isLoggedin') === 'true';
    const hasToken = !!(response && response.token);
    if (serviceMarked || hasToken) {
      this.loading = false;
      const target = this.returnUrl || '/inicio';
  // SessionSyncService will already synchronize session state across tabs when setSession is used.
      console.log('Login successful, navigating to:', target, 'serviceMarked:', serviceMarked, 'hasToken:', hasToken);
      this.router.navigate([target]).then(navigated => {
        console.log('router.navigate result:', navigated, 'current url:', this.router.url);
        setTimeout(() => {
          const stillAtLogin = this.router.url && this.router.url.includes('/auth/login');
          if (!navigated || stillAtLogin) {
            console.warn('Router navigation did not redirect — forcing full page redirect to', target);
            try { window.location.assign(target); } catch (e) { /* ignore */ }
          }
        }, 150);
      }).catch(err => {
        console.error('router.navigate threw:', err);
        try { window.location.assign(target); } catch (e) { /* ignore */ }
      });
    } else {
      this.loading = false;
      console.warn('Login response did not include token and service did not mark session. Staying on login. Response:', response);
      this.showToast('error', 'No autorizado', 'Ocurrió un error al iniciar sesión.', 4000);
    }
  }

  private handleLoginError(error: any): void {
    // Manejo robusto de sesión activa
    const msg = (error && (error.mensaje || error.message || '')).toString();
    const isSesionActiva = (error && (error.status === 409)) || (error && error.status === 'ERROR' && msg.toLowerCase().includes('autenticado'));
    const isUsuarioNoEncontrado = (error && error.status === 403) || msg.includes('Usuario no encontrado');
    const isSinRolesAsignados = msg.includes('no tiene roles asignados');

    this.loading = false;

        // Manejo robusto de sesión activa y contraseña expirada
        const rawMsg = (error && (error.mensaje || error.error?.mensaje || error.message || '')).toString().toLowerCase();
        const isPasswordExpired = rawMsg.includes('expir') || rawMsg.includes('password expir') || rawMsg.includes('contraseña expir') || rawMsg.includes('password expirado') || rawMsg.includes('contraseña expirada');

        if (isPasswordExpired) {
          this.loading = false;
          const { codUsuario } = this.loginForm.value;
          return this.promptUpdatePassword(codUsuario);
        }


    if (isUsuarioNoEncontrado) {
      this.showToast('warning', 'Error de autenticación', 'Usuario o contraseña incorrectos', 3000);
      console.error('Error en login', error);
      // Enviar evento estandarizado al backend (si aplica)
    } else if (isSesionActiva) {
      this.showToast('warning', 'Sesión Activa', 'Ya tienes una sesión activa.', 3000);
    } else if (isSinRolesAsignados) {
      this.showToast('error', 'Error de autenticación', `El usuario no tiene roles asignados para sistema ${this.siglasApplic}.`, 3000);
    } else {
      this.showToast('error', 'Error inesperado', 'Por favor, intenta nuevamente más tarde.', 3000);
      console.error('Error en login', error);
    }
  }

  private showToast(icon: 'success'|'error'|'warning'|'info'|'question', title: string, text: string, timer = 3000): void {
    Swal.fire({
      icon,
      title,
      text,
      toast: true,
      position: 'top-start',
      showConfirmButton: false,
      timer,
      timerProgressBar: true,
    });
  }

  // convenience getter for template access
  get f() { return this.loginForm.controls; }

  private buildDisplayName(resp: any): string {
    if (!resp) return '';

    if (resp.usuario) {
      const given = (resp.usuario.nombre || resp.usuario.firstName || '').toString().trim();
      const family = (resp.usuario.apellido || resp.usuario.lastName || '').toString().trim();
      const firstGiven = given ? given.split(/\s+/)[0] : '';
      const firstFamily = family ? family.split(/\s+/)[0] : '';
      if (firstGiven && firstFamily) return `${firstGiven} ${firstFamily}`;
      if (firstGiven && !firstFamily && resp.nombreCompleto) {
        const parts = resp.nombreCompleto.trim().split(/\s+/).filter(Boolean);
        let maybeFamily = '';
        if (parts.length === 2) maybeFamily = parts[1];
        else if (parts.length === 3) maybeFamily = parts[2];
        else if (parts.length >= 4) maybeFamily = parts[parts.length - 2];
        else maybeFamily = parts.length === 1 ? '' : parts[parts.length - 1];
        return `${firstGiven} ${maybeFamily}`.trim();
      }
    }

    const full = (resp.nombreCompleto || resp.fullName || resp.name || '').toString().trim();
    if (full) {
      const parts = full.split(/\s+/).filter(Boolean);
      if (parts.length === 1) {
        const familyFromObj = (resp.apellido || resp.lastName || (resp.usuario && resp.usuario.apellido) || '').toString().trim();
        const firstFamily = familyFromObj ? familyFromObj.split(/\s+/)[0] : '';
        return `${parts[0]}${firstFamily ? ' ' + firstFamily : ''}`.trim();
      }
      const firstGiven = parts[0];
      let firstFamily = '';
      if (parts.length === 2) firstFamily = parts[1];
      else if (parts.length === 3) firstFamily = parts[2];
      else if (parts.length >= 4) firstFamily = parts[parts.length - 2];
      else firstFamily = parts[parts.length - 1];
      return `${firstGiven} ${firstFamily}`.trim();
    }

    const nombreFallback = (resp.nombre || resp.firstName || '').toString().trim();
    const apellidoFallback = (resp.apellido || resp.lastName || '').toString().trim();
    const fGiven = nombreFallback ? nombreFallback.split(/\s+/)[0] : '';
    const fFamily = apellidoFallback ? apellidoFallback.split(/\s+/)[0] : '';
    return `${fGiven}${fFamily ? ' ' + fFamily : ''}`.trim();
  }

  get currentYear(): number {
    return new Date().getFullYear();
  }
}
  
  