import { AfterViewInit, Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';

declare var bootstrap: any;

@Component({
  selector: 'app-modal-no-category',
  standalone: true,
  imports: [],
  templateUrl: './modal-no-category.component.html',
  styleUrl: './modal-no-category.component.scss'
})
export class ModalNoCategoryComponent {
  @Output() closed = new EventEmitter<void>();
  @ViewChild('modalElement', { static: true }) modalElement!: ElementRef;

  private modalInstance: any;

  onClose() {
    this.closed.emit();
  }

  onOpen() {
    this.modalInstance.show();
  }
}
