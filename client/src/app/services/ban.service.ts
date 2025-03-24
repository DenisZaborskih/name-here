import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service'

@Injectable({
  providedIn: 'root'
})
export class BanService {
  private http: HttpClient = inject(HttpClient);
  private cookieService: CookieService = inject(CookieService);

  constructor() { }

  public ban() {
    const banState = "Banned";
    this.cookieService.set('userState', banState, { expires: 99999 });
    console.log('User state saved to cookies: ', banState);
  }
}
