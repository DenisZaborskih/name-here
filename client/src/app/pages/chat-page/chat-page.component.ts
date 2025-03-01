  import { CommonModule } from '@angular/common';
  import { Component } from '@angular/core';

  enum State {
    Active,
    Search,
    Banned
  }

  @Component({
    selector: 'app-chat-page',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './chat-page.component.html',
    styleUrl: './chat-page.component.scss'
  })
  export class ChatPageComponent {
    public State = State;
    public state: State = State.Search;
  }
