import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatGroupService {

  public chatGroup$ = new BehaviorSubject<string | null>(
    localStorage.getItem('chatGroup')
  );

  public changeGroup(group : string){
    localStorage.setItem('chatGroup', group);
    this.chatGroup$.next(group);
  }

  public clearChatGroup(){
    localStorage.removeItem('chatGroup');
    this.chatGroup$.next(null);
  }
}
