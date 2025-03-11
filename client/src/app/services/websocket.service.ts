
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Message {
  content: string;
  isMine: boolean;
  isImage?: boolean;
}

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private ws!: WebSocket;

  public initWebSocket(chatGroup : string) {
    this.ws = new WebSocket(`ws://localhost/api/v1/chat/ws/${chatGroup}`);
    this.ws.onopen = () => {
      console.log(`WebSocket init success`);
    }

    this.ws.onmessage = (event) => {
      console.log(`message handled!!!`);
      this.recieveMessage(event.data);
    }

    this.ws.onerror = (error) => {
      console.error(`WebSocket was lost with error : ${error}`)
    }
  }

  public sendMessage(msg: string) {
    if (this.ws.readyState === WebSocket.OPEN && this.ws) {
      this.ws.send(msg);
      console.log(`Message ${msg} sent!`);
      return true;
    }
    else {
      console.error(`send message error`);
      return false;
    }
  }

  public recieveMessage(data : any){
    if(typeof(data) === 'string'){

    }
  }

  public closeWebSocket() {
    if (this.ws) this.ws.close;
  }
}