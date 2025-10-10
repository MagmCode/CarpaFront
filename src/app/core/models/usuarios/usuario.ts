export interface RolUsuario {
  id: number;
  alias: string;
  descripcion: string;
  tipo: string;
  aplicacion: string;
  seleccionado?: boolean;
}

export interface Usuario {
  mscUserId: string;
  userId: string;
  fullName: string;
  email: string;
  userStatus: number;
  roles: RolUsuario[];
}