import { Component, OnInit } from '@angular/core';

interface Ciclo {
  ejecucionId: string;
  fechaInicio: string;
  fechaCierre: string;
  nombreHilo: string;
  estatus: string;
  usuario: string;
  idHilo: string;
}

@Component({
  selector: 'app-consultas-hilos-abiertos',
  templateUrl: './consultas-hilos-abiertos.component.html',
  styleUrls: ['./consultas-hilos-abiertos.component.scss']
})
export class ConsultasHilosAbiertosComponent implements OnInit {

  ciclos: Ciclo[] = [
    {
      ejecucionId: 'EJ-001',
      fechaInicio: '01-08-2025, 10:15:30 AM',
      fechaCierre: '01-08-2025, 10:45:00 AM',
      nombreHilo: 'thread_mantenimiento_log_bd_infi',
      estatus: 'TERMINATED',
      usuario: 'programador_scheduler_sepa',
      idHilo: 'TH-1001'
    },
    {
      ejecucionId: 'EJ-002',
      fechaInicio: '01-08-2025, 11:00:00 AM',
      fechaCierre: '',
      nombreHilo: 'thread_backup_bd_infi',
      estatus: 'RUNNING',
      usuario: 'programador_scheduler_sepa',
      idHilo: 'TH-1002'
    },
    {
      ejecucionId: 'EJ-003',
      fechaInicio: '01-08-2025, 09:00:00 AM',
      fechaCierre: '01-08-2025, 09:30:00 AM',
      nombreHilo: 'thread_reporte_diario',
      estatus: 'FAILED',
      usuario: 'admin_sepa',
      idHilo: 'TH-1003'
    }
  ];

  constructor() { }

  ngOnInit(): void {
  }

  forzarCierre(ciclo: Ciclo) {
    alert(`Forzar cierre del hilo: ${ciclo.nombreHilo} (ID: ${ciclo.idHilo})`);
  }
}
