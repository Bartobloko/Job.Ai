import {patchState, signalStore, withMethods, withState} from '@ngrx/signals';
import {UserService} from '../../data-acces/user/user.service';
import {inject} from '@angular/core';
import {firstValueFrom} from 'rxjs';
import { User } from '../../interfaces/user';

type UsersState = {
  users: User[];
}

const initialState: UsersState = {
  users: []
};


export const UsersStore = signalStore(
  {providedIn: 'root'},
  withState(initialState),
  withMethods(
    (store,userService = inject(UserService)) => ({
      async loadAllUsers() {
        const users = await firstValueFrom(userService.getUserList());
        patchState(store,{users});
      }
    })
  )
);
