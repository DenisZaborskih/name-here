import { inject, Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service'

@Injectable({
  providedIn: 'root'
})
export class BanService {
  private cookieService: CookieService = inject(CookieService);

  constructor() { }

  public ban() {
    const banState = "Banned";
    this.cookieService.set('userState', banState, { expires: 99999 });
  }

  public checkBan(){
    return this.cookieService.get('userState') === 'Banned';
  }
}
