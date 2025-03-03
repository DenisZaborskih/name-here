  import { CommonModule } from '@angular/common';
  import { Component } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';

  enum State {
    Active,
    Search,
    Banned
  }

  @Component({
    selector: 'app-chat-page',
    standalone: true,
    imports: [CommonModule, RouterModule, RouterLink],
    templateUrl: './chat-page.component.html',
    styleUrl: './chat-page.component.scss'
  })
  export class ChatPageComponent {
    public State = State;
    private state: State = State.Active;

    getState(){
      return this.state;
    }

    setState(current : State){
      this.state = current;
    }

    sendMessage(){

    }

    addPhoto(){
      return -1;
    }
  }
