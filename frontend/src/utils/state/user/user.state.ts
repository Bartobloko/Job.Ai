import {patchState, signalStore, withMethods, withState} from '@ngrx/signals';
import {AuthService} from '../../data-acces/auth/auth.service';
import {inject} from '@angular/core';
import {firstValueFrom} from 'rxjs';
import { User } from '../../interfaces/user';



const initialState: User = {
  id: 0,
  username: '',
  created_At: new Date()
};


export const UserStore = signalStore(
  {providedIn: 'root'},
  withState(initialState),
  withMethods(
    (store,authService = inject(AuthService)) => ({
      async loadUser() {
        const user = await firstValueFrom(authService.getUser());
        patchState(store,{
          id: user.id,
          username: user.username,
          created_At: user.created_At,
        });
      }
    })
  )
);
