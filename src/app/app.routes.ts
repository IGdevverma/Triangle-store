import { Routes } from '@angular/router';
import { Home } from './features/home/home';
import { Cart } from './features/cart/cart';

export const routes: Routes = [
  {
    path: '',
    component: Home
  },

  {

    path: 'cart',

    component: Cart

  }
];