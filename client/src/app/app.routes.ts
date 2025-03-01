import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'start',
        pathMatch: 'full'
    },
    {
        path: 'start',
        loadComponent: () => import('./pages/start-page/start-page.component').then(m => m.StartPageComponent)
    },
    {
        path: 'chat',
        loadComponent: () => import('./pages/chat-page/chat-page.component').then(m => m.ChatPageComponent)
    }
];
