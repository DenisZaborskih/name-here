
import { Injectable } from '@angular/core';
import { Message } from '../interfaces/message';
import { BehaviorSubject } from 'rxjs';
@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private ws!: WebSocket;
  private messageSubject = new BehaviorSubject<Message | null>(null);
  public message$ = this.messageSubject.asObservable();

  public initWebSocket(chatGroup: string) {
    this.ws = new WebSocket(`ws://localhost/api/v1/chat/ws/${chatGroup}`);
    this.ws.onopen = () => {
      console.log(`WebSocket init success`);
    }

    this.ws.onmessage = (event) => {
      try {
        const msg = this.recieveMessage(event.data);
        console.log('message handled:', msg?.content);
        this.messageSubject.next(msg ? msg : null);
      }
      catch (error) {
        console.log("Error handling message: ", error);
      }
    }

    this.ws.onerror = (error) => {
      console.error(`WebSocket was lost with error : ${error}`)
    }
  }

  public sendMessage(msg: string, uid : string) {
    if (this.ws.readyState === WebSocket.OPEN && this.ws) {
      const msgPayload = {
        content: msg,
        senderId: uid
      }
      this.ws.send(JSON.stringify(msgPayload));
      console.log(`Message ${msg} sent!`);
      return true;
    }
    else {
      console.error(`send message error`);
      return false;
    }
  }

  private recieveMessage(data: any) {
    if (typeof data === 'string') {
      try {
        const jsonData = JSON.parse(data);
        return this.createMessage(jsonData.content, null, true, jsonData.senderId);
      } catch (e) {
        return this.createMessage(data, null, false, null);
      }
    } else {
      const blob = new Blob([data], { type: 'image' });
      const url = URL.createObjectURL(blob);
      return this.createMessage(null, url, false, null);
    }
  }

  public closeWebSocket() {
    if (this.ws) this.ws.close();
  }

  private createMessage(content: string | any, imgURL: string | null, isJSON: boolean, senderId: string | null) {
    return {
      content,
      isMine: false,
      imgURL,
      isJSON,
      senderId
    }
  }

  generateUserId() {
    return Math.random().toString(36).substring(2, 9);
  }
}