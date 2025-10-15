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
    // get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }
  
  togglePassword() {
    this.showPassword = !this.showPassword;
  }

 submit(event: Event): void {
    event.preventDefault();
    this.loading = true;
    const { codUsuario } = this.loginForm.value;
    const payload = {
      codUsuario,
      siglasApplic: 'NOTINFI'
    };
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
        // mark session active so AuthGuard permits access
        localStorage.setItem('isLoggedin', 'true');
        this.loading = false;
        const target = this.returnUrl || '/inicio';
        this.router.navigate([target]);
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
  
  