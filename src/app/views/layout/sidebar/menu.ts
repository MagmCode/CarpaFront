import { MenuItem } from './menu.model';

export const MENU: MenuItem[] = [
  {
    label: 'Menu',
    isTitle: true
  },
  {
    label: 'Inicio',
    icon: 'icon-bdv-icon-bank-l',
    link: '/inicio',
  },
  {
    label:'Seguridad',
    icon: 'icon-bdv-icon-cypher-l',
    subItems: [
      {
        label: 'Aplicaciones',
        link: '/seguridad/aplicaciones',
      },
      {
        label: 'Opciones del Menú',
        link: '/seguridad/opciones-menu',
      },
      {
        label: 'Acciones',
        link: '/seguridad/acciones',
      },
      {
        label: 'Roles',
        link: '/seguridad/roles',
      },
      {
        label: 'Roles - Acciones',
        link: '/seguridad/roles-acciones',
      },
      {
        label: 'Roles - Menú',
        link: '/seguridad/roles-menu',
      },
      {
        label: 'Usuarios',
        link: '/seguridad/usuarios',
      },
      // {
      //   label: 'Consultas',
      //   link: '/seguridad/consultas',
      //   subItems: [
      //   {
      //     label: 'Opciones de Menú por Rol',
      //     link: '/seguridad/consultas/opciones-menu-por-rol',
      //   },
      //   {
      //     label: 'Opciones de Menú por URL',
      //     link: '/seguridad/consultas/opciones-menu-por-url',
      //   },
      //   ]
      // }      
    ]
  },
  {
    label: 'Configuración',
    icon: 'icon-bdv-icon-config-m',
    subItems: [
      {
        label: 'Servicios Web BCV',
        link: '/configuracion/servicios-web-bcv',
      },
      {
        label: 'Parámetros',
        link: '/seguridad/parametros-sistema',
      },
    ]
  },
  {
    label: 'Reportes',
    icon: 'icon-bdv-icon-file-l',
    subItems: [
      {
        label: 'Aplicación',
        link: '/reportes/aplicaciones',
      },

    ]
  },
  {
    label: 'Auditoría',
    icon: 'icon-bdv-icon-filewarning2-m',
    subItems: [
      {
        label: 'Trazas',
        link: '/auditoria/trazas',
      },
      {
        label: 'Seguimiento',
        link: '/auditoria/seguimiento',
      },

    ]
  },
]