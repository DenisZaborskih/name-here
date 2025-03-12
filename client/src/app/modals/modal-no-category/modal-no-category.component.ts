import { AfterViewInit, Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';

declare var bootstrap: any;

@Component({
  selector: 'app-modal-no-category',
  standalone: true,
  imports: [],
  templateUrl: './modal-no-category.component.html',
  styleUrl: './modal-no-category.component.scss'
})
export class ModalNoCategoryComponent implements AfterViewInit {
  @Output() closed = new EventEmitter<void>();
  @ViewChild('modalElement', { static: true }) modalElement!: ElementRef;

  private modalInstance: any;

  ngAfterViewInit() {
    this.modalInstance = new (window as any).bootstrap.Modal(
      this.modalElement.nativeElement,
      { babackdrop: 'static' }
    );
    this.modalInstance.show();
  }

  onClose() {
    this.closed.emit();
    this.modalInstance.hide();
  }

  onOpen() {
    this.modalInstance.show();
  }
}
