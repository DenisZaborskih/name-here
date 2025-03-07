import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-start-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './start-page.component.html',
  styleUrl: './start-page.component.scss'
})
export class StartPageComponent {

  private router : Router = inject(Router);

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
  private selectedCategory: string | null = null;

  toggleCategory(category: string) {
    this.selectedCategory = this.selectedCategory === category ? null : category;
  }

  isSelected(category: string): boolean {
    return this.selectedCategory === category;
  }

  goToChat() {
    if (this.selectedCategory === null) {
      alert("Вы не выбрали ни одной категории!");
    }
    else this.router.navigate(["/chat"]);
  }
}
