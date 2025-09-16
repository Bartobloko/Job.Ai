import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Router} from '@angular/router';
import {CookieService} from 'ngx-cookie-service';
import {UserStore} from '../../state/user/user.state';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private tokenKey = 'authToken';

  constructor(
    private http: HttpClient,
    private router: Router,
    private cookieService: CookieService
  ) { }

  getUser() {
    return this.http.get<{ id: number, username: string, created_At: Date }>('http://localhost:3000/api/users/me');
  }

   login(username: string) {
    this.http.post<{ token: string }>('http://localhost:3000/api/users/login', { username })
      .subscribe(response => {
        this.setToken(response.token)
        window.location.reload();
      });
  }

  setToken(token: string): void {
    this.cookieService.set(this.tokenKey, token, { path: '/', secure: true, sameSite: 'Strict' });
  }

  getToken()  {
    return this.cookieService.get(this.tokenKey) || null;
  }
  removeToken(): void {
    this.cookieService.delete(this.tokenKey, '/');
  }
}
