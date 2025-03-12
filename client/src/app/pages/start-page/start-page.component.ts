import { CommonModule } from '@angular/common';
import { Component, inject, ViewChild, ViewContainerRef } from '@angular/core';
import { Router } from '@angular/router';
import { ChatGroupService } from '../../services/chat-group.service';
import { ModalNoCategoryComponent } from '../../modals/modal-no-category/modal-no-category.component';
@Component({
  selector: 'app-start-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './start-page.component.html',
  styleUrl: './start-page.component.scss'
})
export class StartPageComponent {
  @ViewChild('modalContainer', {read: ViewContainerRef, static: true})
  container!: ViewContainerRef;

  private router: Router = inject(Router);
  private selectedCategory: string | null = null;

  categories = [
    "Россия",
    "Германия",
    "Китай",
    "США",
    "Бразилия",
    "Индия",
    "Япония",
    "Франция",
    "Италия",
    "Канада",
    "Мексика",
    "Испания",
    "Австралия",
    "Южная Корея",
    "Египет"
  ];

  constructor(private chatGroupService: ChatGroupService
  ) { }

  toggleCategory(category: string) {
    this.selectedCategory = this.selectedCategory === category ? null : category;
  }

  isSelected(category: string): boolean {
    return this.selectedCategory === category;
  }

  goToChat() {
    if (this.selectedCategory === null) {
      this.container.clear();
      const componentRef = this.container.createComponent(ModalNoCategoryComponent);

      componentRef.instance.closed.subscribe(()=>{
        this.container.clear();
      });
    }
    else {
      this.chatGroupService.changeGroup(this.selectedCategory);
      this.router.navigate(["/chat"]);
    }
  }
}
