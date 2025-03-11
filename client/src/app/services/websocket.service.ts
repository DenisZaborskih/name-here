
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
      console.error(`WebSocket was lost with error : ${error}`)
    }
  }

  public sendMessage(msg: string, senderId: string): boolean {
    if (this.ws.readyState === WebSocket.OPEN && this.ws) {
      const messageWithSender = {
        content: msg,
        senderId: senderId,
      };
      this.ws.send(JSON.stringify(messageWithSender));
      console.log(`[WebSocketService] Сообщение отправлено: ${msg}`);
      return true;
    } else {
      console.error("[WebSocketService] Ошибка отправки сообщения: WebSocket не открыт");
      return false;
    }
  }

  public sendFile(file: File, senderId: string): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const base64Data = reader.result.split(',')[1];
          const message = {
            type: "file",
            fileData: base64Data,
            senderId: senderId,
            mimeType: file.type
          }
          this.ws.send(JSON.stringify(message));
          console.log("[WebSocketService] Файл отправлен как base64");
        }
      };
      reader.readAsDataURL(file);
      return true;
    } else {
      console.error("[WebSocketService] Ошибка отправки файла: WebSocket не открыт");
      return false;
    }
  }

  private recieveMessage(data: any) {
    if (typeof data === 'string') {
      try {
        const jsonData = JSON.parse(data);
        if (jsonData.type === "file") {
          const url = `data:${jsonData.mimeType};base64,${jsonData.fileData}`
          return this.createMessage(null, url, false, jsonData.senderId);
        }
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

  public generateUserId() {
    return Math.random().toString(36).substring(2, 9);
  }
}