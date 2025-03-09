import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatGroupService {

  public chatGroup$ = new BehaviorSubject<string | null>(null);

  public changeGroup(group : string){
    this.chatGroup$.next(group);
  }
}
