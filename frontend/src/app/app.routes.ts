import { Routes } from '@angular/router';



import {authGuard} from '../utils/guards/auth.guard';



export const routes: Routes = [
  {
    path: '',
    redirectTo: 'redirect',
    pathMatch: 'full'
  },
  {
    path: 'redirect',
    canActivate: [authGuard],
    loadComponent: () => import('../features/auth/auth.component').then(m => m.AuthComponent)
  },
  {
    path: 'auth',
    loadComponent: () => import('../features/auth/auth.component').then(m => m.AuthComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('../features/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'jobs',
    loadComponent: () => import('../features/jobs-table/jobs-table.component').then(m => m.JobsTableComponent),
  },
  {
    path: 'settings',
    loadComponent: () => import('../features/settings/settings.component').then(m => m.SettingsComponent),
  }
];
