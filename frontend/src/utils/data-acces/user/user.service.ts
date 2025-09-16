import { Injectable, inject } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {AuthService} from '../auth/auth.service';
import {User} from '../../interfaces/user';
import {firstValueFrom} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);


  createUser(username: string) {
    firstValueFrom(this.http.post('http://localhost:3000/api/users', username)).then(() => {
      this.authService.login(username);
    });
  }

  deleteUser(userId: number) {
    this.http.delete('http://localhost:3000/api/users/' + userId)
  }

   getUserList() {
    return this.http.get<User[]>('http://localhost:3000/api/users')
  }

}
