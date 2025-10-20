import { Component, OnInit, ViewChild } from '@angular/core';
import Swal from 'sweetalert2';
import { FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { LoginService } from 'src/app/services/login.service';

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
  
  constructor(
    private router: Router, 
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private loginService: LoginService
  ) { }
  
  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      codUsuario:['', [Validators.required]],
      password: ['', [Validators.required]]

    })
  // get return url from route parameters or default to '/inicio'
  this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/inicio';
  }
  
  togglePassword() {
    this.showPassword = !this.showPassword;
  }

 submit(event: Event): void {
    event.preventDefault();
    this.loading = true;
    const { codUsuario, password } = this.loginForm.value;
    const payload = {
      codUsuario,
      password,
      siglasApplic: 'NOTINFI'
    };

    // Clear any stale session flags before attempting login. This prevents old 'isLoggedin' values
    // (from earlier bypass/test runs) from allowing access when backend currently fails.
    try {
      console.log('Clearing previous session flags prior to login attempt');
      localStorage.removeItem('isLoggedin');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('usuarioActual');
    } catch (e) {
      // ignore storage errors
    }

    this.loginService.validarUsuario(payload).subscribe({
      next: (response: any) => {
        if (response && response.token) {
          localStorage.setItem('token', response.token);
        }
        if (response && response.refreshToken) {
          localStorage.setItem('refreshToken', response.refreshToken);
        }
        // Construir nombre de usuario: siempre intentar mostrar "primer nombre" + "primer apellido".
        const buildDisplayName = (resp: any): string => {
          if (!resp) return '';

          // If there's a usuario object with explicit fields, prefer those
          if (resp.usuario) {
            const given = (resp.usuario.nombre || resp.usuario.firstName || '').toString().trim();
            const family = (resp.usuario.apellido || resp.usuario.lastName || '').toString().trim();
            const firstGiven = given ? given.split(/\s+/)[0] : '';
            const firstFamily = family ? family.split(/\s+/)[0] : '';
            if (firstGiven && firstFamily) return `${firstGiven} ${firstFamily}`;
            if (firstGiven && !firstFamily && resp.nombreCompleto) {
              // try to extract a sensible "first surname" from nombreCompleto
              const parts = resp.nombreCompleto.trim().split(/\s+/).filter(Boolean);
              let maybeFamily = '';
              if (parts.length === 2) maybeFamily = parts[1];
              else if (parts.length === 3) maybeFamily = parts[2];
              else if (parts.length >= 4) maybeFamily = parts[parts.length - 2];
              else maybeFamily = parts.length === 1 ? '' : parts[parts.length - 1];
              return `${firstGiven} ${maybeFamily}`.trim();
            }
            // fall through to other sources
          }

          // Use nombreCompleto or fullName if present
          const full = (resp.nombreCompleto || resp.fullName || resp.name || '').toString().trim();
          if (full) {
            const parts = full.split(/\s+/).filter(Boolean);
            if (parts.length === 1) {
              // Only one token: try to use apellido from resp if available
              const familyFromObj = (resp.apellido || resp.lastName || (resp.usuario && resp.usuario.apellido) || '').toString().trim();
              const firstFamily = familyFromObj ? familyFromObj.split(/\s+/)[0] : '';
              return `${parts[0]}${firstFamily ? ' ' + firstFamily : ''}`.trim();
            }
            // Otherwise return first token (given) and last token (family)
            const firstGiven = parts[0];
            // Heurística para elegir el "primer apellido" en lugar del último token
            let firstFamily = '';
            if (parts.length === 2) firstFamily = parts[1];
            else if (parts.length === 3) firstFamily = parts[2];
            else if (parts.length >= 4) firstFamily = parts[parts.length - 2];
            else firstFamily = parts[parts.length - 1];
            return `${firstGiven} ${firstFamily}`.trim();
          }

          // Last resort: try top-level fields
          const nombreFallback = (resp.nombre || resp.firstName || '').toString().trim();
          const apellidoFallback = (resp.apellido || resp.lastName || '').toString().trim();
          const fGiven = nombreFallback ? nombreFallback.split(/\s+/)[0] : '';
          const fFamily = apellidoFallback ? apellidoFallback.split(/\s+/)[0] : '';
          return `${fGiven}${fFamily ? ' ' + fFamily : ''}`.trim();
        };

        const usuarioNombre = buildDisplayName(response);
        if (usuarioNombre) {
          localStorage.setItem('usuarioActual', usuarioNombre);
        }

        // Don't set isLoggedin here; LoginService is responsible for marking session (bypass or backend).
        // Only navigate if the service actually marked the session or the response includes a token.
        const serviceMarked = localStorage.getItem('isLoggedin') === 'true';
        const hasToken = !!(response && response.token);
        if (serviceMarked || hasToken) {
          this.loading = false;
          const target = this.returnUrl || '/inicio';
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
          Swal.fire({
            icon: 'error',
            title: 'No autorizado',
            text: 'Ocurrió un error al iniciar sesión.',
            toast: true,
            position: 'top-start',
            showConfirmButton: false,
            timer: 4000,
            timerProgressBar: true,
          });
        }
      },
      error: (error: any) => {
        // Manejo robusto de sesión activa
        const isSesionActiva = (error.status === 409) || (error.status === 'ERROR' && error.mensaje && error.mensaje.toLowerCase().includes('autenticado'));
        if (error.status === 401 || error.status === 403 || error.status === 500) {
          this.loading = false;
          Swal.fire({
            icon: 'error',
            title: 'Error de autenticación',
            text:  'Usuario o contraseña incorrectos',
            toast: true,
            position: 'top-start',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
          });
          console.error('Error en login', error);
        } else if (isSesionActiva) {
          this.loading = false;
          Swal.fire({
            icon: 'warning',
            title: 'Sesión Activa',
            text:  'Ya tienes una sesión activa.',
            toast: true,
            position: 'top-start',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
          });
        } else {
          this.loading = false;
          Swal.fire({
            icon: 'error',
            title: 'Error inesperado',
            text: 'Por favor, intenta nuevamente más tarde.',
            toast: true,
            position: 'top-start',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
          });
          console.error('Error en login', error);
        }
      }
    })

}

  get currentYear(): number {
    return new Date().getFullYear();
  }
}
  
  