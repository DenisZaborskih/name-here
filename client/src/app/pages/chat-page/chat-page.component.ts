import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';
import { ChatGroupService } from '../../services/chat-group.service';
import { Subscription } from 'rxjs';
import { WebSocketService } from '../../services/websocket.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Message } from '../../interfaces/message';

enum State {
  Active,
  Search,
  Banned
}

@Component({
  selector: 'app-chat-page',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink, ReactiveFormsModule],
  templateUrl: './chat-page.component.html',
  styleUrl: './chat-page.component.scss'
})
export class ChatPageComponent implements OnInit, OnDestroy {
  public State = State;
  public msgForm: FormGroup;
  public messageArray: Message[] = [];

  private state!: State;
  private isPhoto: boolean = true;
  private subscription!: Subscription;
  private messageSubscription!: Subscription;
  private userId: string;

  constructor(
    private chatGroupService: ChatGroupService,
    private wsService: WebSocketService,
    private fb: FormBuilder,
  ) {
    this.msgForm = this.fb.group({
      msg: ['', [Validators.required, Validators.minLength(1)]],
    });

    this.userId = this.wsService.generateUserId();
  }

  ngOnInit() {
    this.subscription = this.chatGroupService.chatGroup$.subscribe((chatGroup) => {
      if (chatGroup) {
        this.log(chatGroup);
        this.state = State.Search;
        this.wsService.initWebSocket(chatGroup);
      }
    });
    this.messageSubscription = this.wsService.message$.subscribe((msg) => {
      if (msg?.content) {
        msg.isMine = msg.senderId === this.userId;
        this.messageArray.push(msg);
      }
    });
  }

  ngOnDestroy() {
    if (this.subscription) this.subscription.unsubscribe();
    if (this.messageSubscription) this.messageSubscription.unsubscribe();
  }

  private log(data: string) {
    console.log(`Logged data: ${data}`);
  }

  getIsPhoto() {
    return this.isPhoto;
  }

  getState() {
    return this.state;
  }

  setState(current: State) {
    this.state = current;
  }

  onEnterPressed(event: Event) {
    const keyEvent = event as KeyboardEvent;
    if (!keyEvent.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  sendMessage() {
    if (this.msgForm.valid) {
      const msgText = this.msgForm.get('msg')?.value;
      if (this.canAddPhoto() && this.wsService.sendMessage(msgText, this.userId)) {
        this.msgForm.reset();
      }
    }
  }

  sendReport() {
    //TODO: отправка жалоб
  }

  canAddPhoto() {
    //TODO: проверка отрпавки фото
    return true;
  }

  addPhoto() {
    return null;
  }
}
