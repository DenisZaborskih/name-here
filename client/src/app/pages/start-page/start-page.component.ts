import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink, RouterModule } from '@angular/router';

@Component({
  selector: 'app-start-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './start-page.component.html',
  styleUrl: './start-page.component.scss'
})
export class StartPageComponent {
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
}
