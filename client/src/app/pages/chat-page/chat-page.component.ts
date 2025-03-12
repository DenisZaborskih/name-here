import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';
import { ChatGroupService } from '../../services/chat-group.service';
import { interval, Subscription } from 'rxjs';
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
  public imagePreview: string | null = null;
  public MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 МБ
  public canAddFile = true;
  public sendPhoto = false;
  
  private selectedFile: File | null = null;
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
      if (msg?.content || msg?.imgURL) {
        msg.isMine = msg.senderId === this.userId;
        this.messageArray.push(msg);
      }
    });
  }

  ngOnDestroy() {
    if (this.subscription) this.subscription.unsubscribe();
    if (this.messageSubscription) this.messageSubscription.unsubscribe();
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
    if (!keyEvent.shiftKey && this.canAddFile) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  sendMessage() {
    if (this.selectedFile) {
      if (this.wsService.sendFile(this.selectedFile)) {
        this.messageArray.push({
          content: null,
          isMine: true,
          imgURL: URL.createObjectURL(this.selectedFile),
          isJSON: false,
          senderId: null
        })
        this.selectedFile = null;
        this.imagePreview = null;
        this.sendPhoto = false;
        this.log("Изображение отправлено");
      }
    } else if (this.msgForm.valid) {
      const msgText = this.msgForm.get('msg')?.value;
      if (this.wsService.sendMessage(msgText, this.userId)) {
        this.messageArray.push({
          content: msgText,
          isMine: true,
          imgURL: null,
          isJSON: false,
          senderId: null
        })
        this.msgForm.reset();
        this.log("Текстовое сообщение отправлено");
      }
    }
  }

  sendReport() {
    //TODO: отправка жалоб
  }

  handleFileInput(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (this.validateFile(file)) {
        this.selectedFile = file;
        this.imagePreview = URL.createObjectURL(file);
        this.sendPhoto = true;
        this.log(`Файл выбран: ${file.name}`);
      } else {
        this.canAddFile = false;
        this.log(`Ошибка выбора файла: недопустимый формат или размер`);
        setTimeout(() =>{
          this.canAddFile = true;
        }, 5000);
      }
    }
  }

  removeImage() {
    this.imagePreview = null;
    this.selectedFile = null;
    this.sendPhoto = false;
    this.log("Изображение удалено");
  }

  private validateFile(file: File): boolean {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    return file.size <= this.MAX_IMAGE_SIZE && allowedTypes.includes(file.type);
  }

  private log(message: string) {
    console.log(`[ChatPageComponent] ${new Date().toISOString()}: ${message}`);
  }
}
