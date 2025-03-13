
import { Injectable } from '@angular/core';
import { Message } from '../interfaces/message';
import { BehaviorSubject } from 'rxjs';
import { State } from '../enums/state';
@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private ws!: WebSocket;
  private messageSubject = new BehaviorSubject<Message | null>(null);
  private state = new BehaviorSubject<State>(State.Search);

  public state$ = this.state.asObservable();
  public message$ = this.messageSubject.asObservable();

  public initWebSocket(chatGroup: string) {
    this.ws = new WebSocket(`ws://192.168.155.66/api/v1/chat/ws/${chatGroup}`);
    this.ws.onopen = () => {
      console.log(`WebSocket init success`);
    }

    this.ws.onmessage = (event) => {
      try {
        console.log(event);
        const msg = this.recieveMessage(event.data);
        console.log('message handled:', msg?.content);
        this.messageSubject.next(msg ? msg : null);
      }
      catch (error) {
        console.log("Error handling message: ", error);
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
      console.log(`[WebSocketService] Сообщение отправлено: ${msg}`);
      return true;
    } else {
      console.error("[WebSocketService] Ошибка отправки сообщения: WebSocket не открыт");
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
        console.log("jsondata: ", jsonData);
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
    switch (status) {
      case 1012: {
        this.state.next(State.Banned);
        break;
      }
      case 1014: {
        this.state.next(State.Search);
        break;
      }
      case 1101: {
        this.state.next(State.Active);
        break;
      }
      case 1102: {
        this.state.next(State.Search);
        break;
      }
      case 1103: {
        this.state.next(State.Search);
        break;
      }
    }
  }

  public generateUserId() {
    return Math.random().toString(36).substring(2, 9);
  }
}