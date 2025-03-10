import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';
import { ChatGroupService } from '../../services/chat-group.service';
import { Subscription } from 'rxjs';
import { WebSocketService } from '../../services/websocket.service';

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
export class ChatPageComponent implements OnInit, OnDestroy {
  public State = State;
  private state!: State;
  private canAddPhoto: Boolean = true;
  private subscription!: Subscription

  constructor(
    private chatGroupService: ChatGroupService,
    private wsService : WebSocketService
  ) { }

  ngOnInit() {
    this.subscription = this.chatGroupService.chatGroup$.subscribe((chatGroup) => {
      if (chatGroup) {
        this.log(chatGroup);
        this.state = State.Search;
        this.wsService.initWebSocket(chatGroup);
      }
    });
  }

  ngOnDestroy() {
    if (this.subscription) this.subscription.unsubscribe();
  }

  private log(data: string) {
    console.log(data);
  }

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
