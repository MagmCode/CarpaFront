import { Component, OnInit } from '@angular/core';
import { AplicacionesService, Aplicacion } from 'src/app/services/aplicaciones-services/aplicaciones.service';

interface SubOpcionMenu {
  nombre: string;
  url: string;
}

interface OpcionMenu {
  nombre: string;
  subOpciones: SubOpcionMenu[];
}

interface MenuPorUrl {
  opcionesMenu: OpcionMenu[];
  aplicacion: string;
}

@Component({
  selector: 'app-opciones-menu-por-url',
  templateUrl: './opciones-menu-por-url.component.html',
  styleUrls: ['./opciones-menu-por-url.component.scss']
})
export class OpcionesMenuPorUrlComponent implements OnInit {

  
  aplicaciones: Aplicacion[] = [];
  aplicacionSeleccionada: string = '';
  
  datos:MenuPorUrl[] = [
    {
      opcionesMenu: [
        { nombre: 'Cuentas', subOpciones: [
          { nombre: 'Consulta de cuentas', url: '/cuentas/consulta' },
          { nombre: 'Apertura de cuenta', url: '/cuentas/apertura' }
        ]},
        { nombre: 'Tarjetas de crédito', subOpciones: [
          { nombre: 'Solicitar tarjeta', url: '/tarjetas/solicitar' },
          { nombre: 'Consulta de tarjetas', url: '/tarjetas/consulta' }
        ]}
      ],
      aplicacion: 'Gestión Usuarios'
    },
    {
      opcionesMenu: [
        { nombre: 'Divisas', subOpciones: [
          { nombre: 'Compra de divisas', url: '/divisas/compra' },
          { nombre: 'Venta de divisas', url: '/divisas/venta' }
        ]},
        { nombre: 'Inversiones', subOpciones: [
          { nombre: 'Consulta de inversiones', url: '/inversiones/consulta' }
        ]}
      ],
      aplicacion: 'Inventario'
    },
    {
      opcionesMenu: [
        { nombre: 'Chequeras', subOpciones: [
          { nombre: 'Solicitar chequera', url: '/chequeras/solicitar' }
        ]},
        { nombre: 'Afiliaciones de servicios', subOpciones: [
          { nombre: 'Afiliar servicio', url: '/servicios/afiliar' },
          { nombre: 'Consultar afiliaciones', url: '/servicios/consultar' }
        ]}
      ],
      aplicacion: 'Gestión Usuarios'
    },
    {
      opcionesMenu: [
        { nombre: 'Cuentas', subOpciones: [
          { nombre: 'Consulta de cuentas', url: '/cuentas/consulta' },
          { nombre: 'Apertura de cuenta', url: '/cuentas/apertura' }
        ]},
        { nombre: 'Tarjetas de crédito', subOpciones: [
          { nombre: 'Solicitar tarjeta', url: '/tarjetas/solicitar' },
          { nombre: 'Consulta de tarjetas', url: '/tarjetas/consulta' }
        ]}
      ],
      aplicacion: 'Gestión Usuarios'
    },
    {
      opcionesMenu: [
        { nombre: 'Divisas', subOpciones: [
          { nombre: 'Compra de divisas', url: '/divisas/compra' },
          { nombre: 'Venta de divisas', url: '/divisas/venta' }
        ]},
        { nombre: 'Inversiones', subOpciones: [
          { nombre: 'Consulta de inversiones', url: '/inversiones/consulta' }
        ]}
      ],
      aplicacion: 'Inventario'
    },
    {
      opcionesMenu: [
        { nombre: 'Chequeras', subOpciones: [
          { nombre: 'Solicitar chequera', url: '/chequeras/solicitar' }
        ]},
        { nombre: 'Afiliaciones de servicios', subOpciones: [
          { nombre: 'Afiliar servicio', url: '/servicios/afiliar' },
          { nombre: 'Consultar afiliaciones', url: '/servicios/consultar' }
        ]}
      ],
      aplicacion: 'Gestión Usuarios'
    }
    
  ];

  datosFiltrados: MenuPorUrl[] = [];
  
  constructor(
    private aplicacionesService: AplicacionesService
  ) { }
  
  currentPage: number = 1;
  pageSize: number = 10;
  totalRows: number = 0;
  paginatedRows: any[] = [];

  totalPages: number = 0;
  pagesArray: number[] = [];

  ngOnInit(): void {
    this.aplicaciones = this.aplicacionesService.getAplicaciones();
    this.datosFiltrados = [...this.datos];
    this.updatePagination();
  }

  filtrarDatos() {
    if (!this.aplicacionSeleccionada) {
      this.datosFiltrados = [...this.datos];
    } else {
      this.datosFiltrados = this.datos.filter(item =>
        item.aplicacion === this.aplicacionSeleccionada
      );
    }
    this.currentPage = 1;
    this.updatePagination();
  }

  getAllRows(): any[] {
    const rows: any[] = [];
    for (const item of this.datosFiltrados) {
      for (const opcion of item.opcionesMenu) {
        rows.push({
          tipo: 'opcion',
          nombre: opcion.nombre,
          url: '',
          aplicacion: item.aplicacion
        });
        for (const sub of opcion.subOpciones) {
          rows.push({
            tipo: 'subopcion',
            nombre: sub.nombre,
            url: sub.url,
            aplicacion: item.aplicacion
          });
        }
      }
    }
    return rows;
  }

  updatePagination() {
  const allRows = this.getAllRows();
  this.totalRows = allRows.length;
  this.totalPages = Math.ceil(this.totalRows / this.pageSize);
  this.pagesArray = Array(this.totalPages).fill(0).map((x, i) => i + 1);
  const start = (this.currentPage - 1) * this.pageSize;
  this.paginatedRows = allRows.slice(start, start + this.pageSize);
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.updatePagination();
  }
}
