import { Injectable, inject } from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class BotService {
  private http = inject(HttpClient);


  startBot() {
    return this.http.post('http://localhost:3000/api/bot/start', {});
  }

  getBotStatus() {
    return this.http.get<{ isRunning: boolean }>('http://localhost:3000/api/bot/status');
  }
}
