import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ChatGroupService } from '../../services/chat-group.service';
import { Subscription } from 'rxjs';
import { WebSocketService } from '../../services/websocket.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Message } from '../../interfaces/message';
import { State } from '../../enums/state';
import { BanService } from '../../services/ban.service';

@Component({
  selector: 'app-chat-page',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
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

  private router: Router = inject(Router);
  private searchFlag = true;
  private chatGroup!: string;
  private selectedFile: File | null = null;
  private state!: State;
  private subscription!: Subscription;
  private messageSubscription!: Subscription;
  private stateSubscription!: Subscription;
  private userId: string;

  constructor(
    private chatGroupService: ChatGroupService,
    private wsService: WebSocketService,
    private banService: BanService,
    private fb: FormBuilder,
  ) {
    this.msgForm = this.fb.group({
      msg: ['', [Validators.required, Validators.minLength(1)]],
    });
    this.userId = this.wsService.generateUserId();
  }

  ngOnInit() {
    if (this.banService.checkBan()) {
      this.router.navigate(['/start']);
    }
    this.subscription = this.chatGroupService.chatGroup$.subscribe((chatGroup) => {
      if (chatGroup) {
        this.state = State.Search;
        this.chatGroup = chatGroup;
      }
    });
    this.messageSubscription = this.wsService.message$.subscribe((msg) => {
      if (msg?.content || msg?.imgURL) {
        this.messageArray.push(msg);
      }
    });
    this.stateSubscription = this.wsService.status$.subscribe((curState) => {
      if (curState === 1012) {
        this.state = State.Banned;
        this.banService.ban();
        this.router.navigate(['/start']);
      }
      else if (curState === 1102 && this.searchFlag) {
        this.state = State.Search;
        this.clearMessages();
        this.wsService.closeWebSocket();
        this.wsService.initWebSocket(this.chatGroup);
        this.searchFlag = false;
      }
      else if (curState === 1103 || curState === 1104) {
        this.state = State.Search;
        this.wsService.closeWebSocket();
        this.clearMessages();
        this.wsService.initWebSocket(this.chatGroup);
        this.searchFlag = true;
      }
      else if (curState === 1101) {
        this.clearMessages();
        this.state = State.Active;
        this.searchFlag = false;
      }
    });
  }

  ngOnDestroy() {
    this.wsService.setState(1104);
    if (this.subscription) this.subscription.unsubscribe();
    if (this.messageSubscription) this.messageSubscription.unsubscribe();
    if (this.stateSubscription) this.stateSubscription.unsubscribe();
    this.wsService.closeWebSocket();
    this.clearMessages();
  }

  getState() {
    return this.state;
  }

  toSearch(current: State) {
    this.state = current;
    this.searchFlag = true;
    this.wsService.closeWebSocket();
    this.wsService.initWebSocket(this.chatGroup);
  }

  onEnterPressed(event: Event) {
    const keyEvent = event as KeyboardEvent;
    if (!keyEvent.shiftKey && this.canAddFile) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  closeConnection() {
    this.wsService.closeWebSocket();
    this.router.navigate(['/start']);
  }

  sendMessage() {
    if (this.selectedFile) {
      if (this.wsService.sendFile(this.selectedFile)) {
        this.messageArray.push({
          content: null,
          isMine: true,
          imgURL: URL.createObjectURL(this.selectedFile),
          senderId: null
        });
        this.selectedFile = null;
        this.imagePreview = null;
        this.sendPhoto = false;
      }
    } else if (this.msgForm.valid) {
      const msgText = this.msgForm.get('msg')?.value;
      if (this.wsService.sendMessage(msgText, this.userId)) {
        this.messageArray.push({
          content: msgText,
          isMine: true,
          imgURL: null,
          senderId: null
        })
        this.msgForm.reset();
      }
    }
  }

  sendReport() {
    this.wsService.sendReport();
  }

  handleFileInput(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (this.validateFile(file)) {
        this.selectedFile = file;
        this.imagePreview = URL.createObjectURL(file);
        this.sendPhoto = true;
      } else {
        this.canAddFile = false;
        setTimeout(() => {
          this.canAddFile = true;
        }, 5000);
      }
    }
  }

  removeImage() {
    this.imagePreview = null;
    this.selectedFile = null;
    this.sendPhoto = false;
  }

  private validateFile(file: File): boolean {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    return file.size <= this.MAX_IMAGE_SIZE && allowedTypes.includes(file.type);
  }

  private clearMessages() {
    this.messageArray = [];
  }
}
