import { Routes } from '@angular/router';
import { Home } from './features/home/home';
import { Cart } from './features/cart/cart';
import { ProductDetail } from './features/product-detail/product-detail';
import { Checkout } from './features/checkout/checkout';
import { Orders } from './features/order/order';
import { Admin } from './features/admin/admin';
import { Login } from './features/login/login';
import { authGuard } from './guards/auth-guard';
import { Wishlist } from './features/wishlist/wishlist';
import { RequestQuote } from './features/request-quote/request-quote';
import { DealerRegistration } from './features/dealer-registration/dealer-registration';

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
  },

  {
    path: 'orders',
    component: Orders
  },
  {
    path: 'admin',
    component: Admin,
    canActivate: [authGuard]
  },
  {
    path: 'login',
    component: Login

  },
  {

    path: 'shop',

    loadComponent: () =>

      import('./features/shop/shop')

        .then(m => m.Shop)

  },
  {
    path: 'wishlist',
    component: Wishlist
  },
  {
    path: 'request-quote',
    component: RequestQuote
  },
  {
    path: 'dealer-registration',
    component: DealerRegistration
  }

];