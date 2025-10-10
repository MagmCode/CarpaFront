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
        if (response && response.nombreCompleto) {
          // Extraer primer nombre y primer apellido
          const partes = response.nombreCompleto.trim().split(' ');
          let nombre = partes[0] || '';
          let apellido = partes.length > 1 ? partes[2] : '';
          const usuarioNombre = `${nombre} ${apellido}`.trim();
          localStorage.setItem('usuarioActual', usuarioNombre);
        }
        this.loading = false;
        this.router.navigate(['/inicio']);
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
//   console.log('Payload enviado', payload);
//   this.loginService.validarUsuario(payload).subscribe({
//     next: (response: any) => {
//       console.log('Respuesta del backend:', response);
//       // Guarda el token en el localStorage
//       if (response && response.token) {
//         localStorage.setItem('token', response.token);
//       }
//       // Guarda el usuario en localStorage para el sidebar
//       if (response && response.fullName) {
//         localStorage.setItem('usuarioActual', JSON.stringify(response));
//       }
//       this.router.navigate(['/dashboard']);
//     },
//     error: (error: any) => {
//       console.error('Error en login', error);
//       // Manejo de error
//     }
//   });
}

  // submit(event:Event):void {
  //   const {codUsuario: codUsuario} = this.loginForm.value
  //   const payload = {
  //     codUsuario, 
  //     siglasApplic: 'NOTINFI'
  //   }
  // console.log('datos', payload)    
  //   this.loginService.validarUsuario(payload).subscribe({
  //     next: (response: any) => {
  //       console.log(response)
  //       this.router.navigate(['/dashboard']);

  //     },
  //     error:(error: any) => {
  //       // let errorMessage = this.extraerMensajeError(error);
  //     }
  //   })
    
  // }

  
}
  
  