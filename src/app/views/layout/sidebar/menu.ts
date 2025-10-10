import { MenuItem } from './menu.model';

export const MENU: MenuItem[] = [
  {
    label: 'Main',
    isTitle: true
  },
  {
    label: 'Inicio',
    icon: 'home',
    link: '/inicio',
  },
  {
    label:'seguridad',
    icon: 'shield',
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
      {
        label: 'Parámetros',
        link: '/seguridad/parametros-sistema',
      },
      {
        label: 'Agregar Usuarios en lote',
        link: '/seguridad/agregar-usuarios',
      },
      {
        label: 'Consultas',
        link: '/seguridad/consultas',
        subItems: [
        {
          label: 'Opciones de Menú por Rol',
          link: '/seguridad/consultas/opciones-menu-por-rol',
        },
        {
          label: 'Opciones de Menú por URL',
          link: '/seguridad/consultas/opciones-menu-por-url',
        },
        ]
      },
      {
        label: 'Eliminar Usuarios en lote',
        link: '/seguridad/eliminar-usuarios',
      },
      {
        label: 'Programador de Tareas (SHEDULER)',
        link: '/seguridad/programador-tareas',
      },
      
    ]
  },
  {
    label: 'Operaciones',
    icon: 'inbox',
    subItems: [
      {
        label: 'Consultas de Hilos Abiertos',
        link: '/operaciones/consultas-hilos-abiertos',
      },
    ]
  },
  {
    label: 'Configuración',
    icon: 'settings',
    subItems: [
      {
        label: 'Servicios Web BCV',
        link: '/configuracion/servicios-web-bcv',
      }
    ]
  },
]