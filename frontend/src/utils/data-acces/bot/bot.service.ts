import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class BotService {

  constructor(
    private http: HttpClient
  ) { }

  startBot() {
    return this.http.post('http://localhost:3000/api/bot/start', {});
  }
}
