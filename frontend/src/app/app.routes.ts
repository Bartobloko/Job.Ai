import { Routes } from '@angular/router';
import {JobsTableComponent} from '../features/jobs-table/jobs-table.component';
import {DashboardComponent} from '../features/dashboard/dashboard.component';
import {AuthComponent} from '../features/auth/auth.component';
import {authGuard} from '../utils/guards/auth.guard';
import {SettingsComponent} from '../features/settings/settings.component';


export const routes: Routes = [
  {
    path: '',
    redirectTo: 'redirect',
    pathMatch: 'full'
  },
  {
    path: 'redirect',
    canActivate: [authGuard],
    component: AuthComponent
  },
  {
    path: 'auth',
    component: AuthComponent
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
  },
  {
    path: 'jobs',
    component: JobsTableComponent,
  },
  {
    path: 'settings',
    component: SettingsComponent,
  }
];
