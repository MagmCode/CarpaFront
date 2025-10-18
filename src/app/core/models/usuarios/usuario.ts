export interface RolUsuario {
  // backend fields
  mscRoleId?: number;
  roleName?: string;
  description?: string;
  inUsoEnRed?: string;
  idApplication?: number | string;
  siglasApplic?: string;
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