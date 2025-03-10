
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Message {
  content: string;
  isMine: boolean;
  isImage?: boolean;
}

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private ws!: WebSocket;
  private messageSubject = new BehaviorSubject<string | null>(null);

  public initWebSocket(chatGroup : string) {
    this.ws = new WebSocket(`ws://localhost/api/v1/chat/ws/${chatGroup}`);
    this.ws.onopen = () => {
      console.log(`WebSocket init success`);
    }

    this.ws.onmessage = (event) => {
      this.messageSubject.next(event.data);
    }

    this.ws.onerror = (error) => {
      console.error(`WebSocket was lost with error : ${error}`)
    }
  }

  public sendMessage(msg: string) {
    if (this.ws.readyState === WebSocket.OPEN && this.ws) {
      this.ws.send(msg);
    }
    else {
      console.error(`WebSocket error while send msg/ robably not open`);
    }
  }

  public closeWebSocket() {
    if (this.ws) this.ws.close;
  }
}