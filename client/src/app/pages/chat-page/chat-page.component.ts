import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';
import { ChatGroupService } from '../../services/chat-group.service';
import { Subscription } from 'rxjs';
import { Message, WebSocketService } from '../../services/websocket.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

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
  private subscription!: Subscription
  private message: Message = {
    content: "",
    isMine: true
  }

  constructor(
    private chatGroupService: ChatGroupService,
    private wsService: WebSocketService,
    private fb: FormBuilder,
  ) {
    this.msgForm = this.fb.group({
      msg: ['', [Validators.required, Validators.minLength(1)]],
    })
  }

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

  onEnterPressed(event : Event){
    const keyEvent = event as KeyboardEvent;
    if(!keyEvent.shiftKey){
      event.preventDefault();
      this.sendMessage();
    }
  }

  sendMessage() {
    if (this.msgForm.valid) {
      const msgText = this.msgForm.get('msg')?.value;
      if (this.canAddPhoto() && this.wsService.sendMessage(msgText)) {
        this.message = {
          content: msgText,
          isMine: true,
          isImage: this.addPhoto()
        }
        this.messageArray.push(this.message);
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
    return true;
  }
}
