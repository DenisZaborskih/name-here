
import { Injectable } from '@angular/core';
import { Message } from '../interfaces/message';
import { BehaviorSubject } from 'rxjs';
@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private ws!: WebSocket;
  private messageSubject = new BehaviorSubject<Message | null>(null);
  private status = new BehaviorSubject<number>(1102);

  public status$ = this.status.asObservable();
  public message$ = this.messageSubject.asObservable();

  public initWebSocket(chatGroup: string) {
    this.ws = new WebSocket(`ws://192.168.51.66/api/v1/chat/ws/${chatGroup}`);
    this.ws.onopen = () => {
      console.log(`WebSocket init success`);
    }

    this.ws.onmessage = (event) => {
      try {
        const msg = this.recieveMessage(event.data);
        this.messageSubject.next(msg ? msg : null);
      }
      catch (error) {
        console.error("Error handling message: ", error);
      }
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket was lost with error : ', error);
    }
  }

  public sendMessage(msg: string, senderId: string): boolean {
    if (this.ws.readyState === WebSocket.OPEN && this.ws) {
      const messageWithSender = {
        action: 'send',
        senderId: senderId,
        content: msg
      };
      this.ws.send(JSON.stringify(messageWithSender));
      return true;
    } else {
      return false;
    }
  }

  public sendFile(file: File) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        const reader = new FileReader();
        reader.onload = () => {
          this.ws.send(reader.result as ArrayBuffer);
        };
        reader.readAsArrayBuffer(file);
        return true;
      }
      catch (e) {
        console.error("error image sent: ", e);
      }
    }
    return false;
  }

  private recieveMessage(data: any) {
    if (typeof data === 'string') {
      try {
        const jsonData = JSON.parse(data);
        this.setState(jsonData.status);
        return this.createMessage(jsonData.content, null, jsonData.senderId);
      } catch (e) {
        return this.createMessage(data, null, null);
      }
    } else {
      const blob = new Blob([data], { type: 'image' });
      const url = URL.createObjectURL(blob);
      return this.createMessage(null, url, null);
    }
  }

  public sendReport() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action: 'report' }));
    }
  }

  public closeWebSocket() {
    if (this.ws) this.ws.close();
  }

  private createMessage(content: string | any, imgURL: string | null, senderId: string | null) {
    return {
      content,
      isMine: false,
      imgURL,
      senderId
    }
  }

  setState(status: number) {
    this.status.next(status);
  }

  public generateUserId() {
    return Math.random().toString(36).substring(2, 9);
  }
}