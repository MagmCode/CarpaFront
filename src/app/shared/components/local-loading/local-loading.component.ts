import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-local-loading',
  template: `
    <div *ngIf="loading" class="local-loading-overlay">
      <div class="spinner-border text-primary" role="status">
        <!-- <span class="visually-hidden">Cargando...</span> -->
      </div>
    </div>
  `,
  styles: [
    `
      .local-loading-overlay {
        position: absolute;
        inset: 0; /* top:0; right:0; bottom:0; left:0 */
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255,255,255,0.6);
        z-index: 999; /* above card content */
        pointer-events: auto;
      }
    `
  ]
})
export class LocalLoadingComponent {
  @Input() loading = false;
}
