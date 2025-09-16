import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {AuthService} from '../auth/auth.service';
import {Settings} from '../../interfaces/settings';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {

  constructor(
    private http: HttpClient,
  ) { }


  getAccountSettings() {
    return this.http.get<Settings>('http://localhost:3000/api/settings')
  }

  updateAccountSettings(settings: Settings) {
    return this.http.put<Settings>('http://localhost:3000/api/settings', settings)
  }
}
