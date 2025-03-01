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
  public categories : number[] = [1,2,3,4,5,6,7,8,9,10];
}
