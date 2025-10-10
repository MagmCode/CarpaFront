import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-generic-modal',
  templateUrl: './generic-modal.component.html',
  styleUrls: ['./generic-modal.component.scss'],
})
export class GenericModalComponent {
  @Input() title: string = '';
  @Input() actions: { label: string; class: string; handler: () => void }[] =
    [];
  @Output() closeModal = new EventEmitter<string>();

  close(reason: string) {
    this.closeModal.emit(reason);
  }
}
