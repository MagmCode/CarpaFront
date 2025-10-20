import { MenuItem } from './menu.model';

export const MENU: MenuItem[] = [
  {
    label: 'Menu',
    isTitle: true,
  },
  {
    label: 'Inicio',
    icon: 'icon-bdv-icon-bank-l',
    link: '/inicio',
  },
  {
    label: 'Accesos',
    icon: 'icon-bdv-icon-cypher-l',
    subItems: [
      {
        label: 'Sistemas',
        link: '/accesos/sistemas',
      },
      {
        label: 'Opciones del Menú',
        link: '/accesos/opciones-menu',
      },
      {
        label: 'Privilegios',
        link: '/accesos/privilegios',
      },
      {
        label: 'Roles',
        link: '/accesos/roles',
      },
      {
        label: 'Roles - Privilegios',
        link: '/accesos/roles-privilegios',
      },
      {
        label: 'Roles - Menú',
        link: '/accesos/roles-menu',
      },
      {
        label: 'Usuarios',
        link: '/accesos/usuarios',
      },
      // {
      //   label: 'Consultas',
      //   link: '/accesos/consultas',
      //   subItems: [
      //   {
      //     label: 'Opciones de Menú por Rol',
      //     link: '/accesos/consultas/opciones-menu-por-rol',
      //   },
      //   {
      //     label: 'Opciones de Menú por URL',
      //     link: '/accesos/consultas/opciones-menu-por-url',
      //   },
      //   ]
      // }
    ],
  },
  {
    label: 'Configuración',
    icon: 'icon-bdv-icon-config-m',
    subItems: [
      {
        label: 'Conexiones',
        link: '/configuracion/conexiones',
      },
      {
        label: 'Criterios',
        link: '/configuracion/criterios',
      },
    ],
  },
  {
    label: 'Reportes',
    icon: 'icon-bdv-icon-file-l',
    subItems: [
      {
        label: 'Aplicación',
        link: '/reportes/aplicaciones',
      },
    ],
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
    ],
  },
  // {
  //   label: 'Administrador',
  //   icon: 'icon-bdv-icon-configclient-m',
  //   subItems: [
  //     {
  //       label: 'Conexiones',
  //       subItems: [
  //         {
  //           label: 'Equipos',
  //           link: '/administrador/conexiones/equipos',
  //         },
  //         {
  //           label: 'Drivers',
  //           link: '/administrador/conexiones/drivers',
  //         },
  //       ],
  //     },
  //   ],
  // },
];
