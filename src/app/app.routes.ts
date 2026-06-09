import { Routes } from '@angular/router';
import { Home } from './features/home/home';
import { Cart } from './features/cart/cart';
import { ProductDetail } from './features/product-detail/product-detail';
import { Checkout } from './features/checkout/checkout';

export const routes: Routes = [
  {
    path: '',
    component: Home
  },

  {

    path: 'cart',

    component: Cart

  },
  {

    path: 'product/:id',

    component: ProductDetail

  },
  {
    path: 'checkout',
    component: Checkout
  }

];