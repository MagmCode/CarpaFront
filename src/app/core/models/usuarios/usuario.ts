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
  seleccionado?: boolean;
  imported?: boolean; // indica si el usuario fue importado desde un archivo
}