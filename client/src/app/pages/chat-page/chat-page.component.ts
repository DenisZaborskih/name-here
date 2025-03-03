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
  private canAddPhoto: Boolean = true;

  getCanAddPhoto() {
    return this.canAddPhoto;
  }

  getState() {
    return this.state;
  }

  setState(current: State) {
    this.state = current;
  }

  sendMessage() {
    //TODO: отправка сообщений
  }

  sendReport() {
    //TODO: отправка жалоб
  }

  addPhoto() {
    //TODO: проверка размера изображений и отправка в случае разрешения
    this.canAddPhoto = !this.canAddPhoto;
  }
}
