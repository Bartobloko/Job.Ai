import {Component, inject, HostListener} from '@angular/core';
import {RouterLink, RouterLinkActive} from '@angular/router';
import {UsersStore} from '../../utils/state/users/users.state';
import { User } from '../../utils/interfaces/user';
import {UserStore} from '../../utils/state/user/user.state';
import {AuthService} from '../../utils/data-acces/auth/auth.service';
import { NgIconComponent } from '@ng-icons/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-navbar',
    imports: [
        RouterLink,
        RouterLinkActive,
        NgIconComponent,
        CommonModule
    ],
    templateUrl: './navbar.component.html',
    styleUrl: './navbar.component.scss'
})
export class NavbarComponent {


  constructor(
    private authService: AuthService
  ) {}

  isAccountDropdownOpen = false;
  isMobileMenuOpen = false;

  usersStore = inject(UsersStore);
  userStore = inject(UserStore);

  get accounts(): User[] {
    return this.usersStore.users();
  }

  toggleAccountDropdown(): void {
    this.isAccountDropdownOpen = !this.isAccountDropdownOpen;
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  selectAccount(account: User) {
    this.authService.login(account.username);
    this.isAccountDropdownOpen = false;
  }

  createNewAccount(): void {
    // Implement your account creation logic here
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.account-dropdown')) {
      this.isAccountDropdownOpen = false;
    }
    if (!target.closest('.mobile-menu')) {
      this.isMobileMenuOpen = false;
    }
  }

}

