import {Component, inject} from '@angular/core';
import {AccountCreateFormComponent} from './utils/account-create-form/account-create-form.component';
import {UsersStore} from '../../utils/state/users/users.state';
import {AuthService} from '../../utils/data-acces/auth/auth.service';
import {UserStore} from '../../utils/state/user/user.state';
import {Router} from '@angular/router';

import { NgIconComponent } from '@ng-icons/core';

@Component({
    selector: 'app-auth',
  imports: [
    AccountCreateFormComponent,
    NgIconComponent
],
    templateUrl: './auth.component.html',
    styleUrl: './auth.component.scss'
})
export class AuthComponent {
  private authService = inject(AuthService);
  private router = inject(Router);


  readonly usersStore = inject(UsersStore);
  readonly userStore = inject(UserStore);

  showDeleteConfirm: boolean = false;

  deleteAccount(): void {}
  cancelDelete(): void {}
  confirmDelete(userId: number) {}
  accountCreation: boolean = false;

  login(username: string) {
    this.authService.login(username);
    this.router.navigate(['/dashboard']);
  }

}
