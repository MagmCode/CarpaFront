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
  imported?: boolean;
  // Nuevos campos para alta de usuario
  typeAccess?: '' | 'Local' | 'Directorio Activo' | 'LDAP';
  login?: string;
  clave?: string;
  encriptamiento?: string;
  cedula?: number;
  descCargo?: string;
  descGeneral?: string;
  passwordDays?: number;
  vigencia?: number; // días
  isEditable?: boolean;
}