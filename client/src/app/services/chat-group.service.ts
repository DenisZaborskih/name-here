import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatGroupService {

  public chatGroup$ = new Subject<string>();

  public changeGroup(group : string){
    this.chatGroup$.next(group);
  }
}
