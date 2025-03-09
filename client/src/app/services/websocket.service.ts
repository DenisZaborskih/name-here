
import { Injectable } from '@angular/core';

export interface Message {
  content: string;
  isMine: boolean;
  isImage?: boolean;
}

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  
}