import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { UsuariosService } from 'src/app/services/usuarios/usuarios.service';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UsuariosResolver implements Resolve<any> {
  constructor(private usuariosService: UsuariosService) {}

  resolve(): Observable<any> {
    return this.usuariosService.consultarUsuarios();
  }
}