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
import { TeamKitDesigner } from './features/team-kit-designer/team-kit-designer';
import { KitCategory } from './features/kit-category/kit-category';
import { TeamKitCustomize } from './features/team-kit-customize/team-kit-customize';

import { Register } from './features/register/register';
import { Profile } from './features/profile/profile';
import { Dashboard } from './features/dashboard/dashboard';
import { EditProfile } from './features/edit-profile/edit-profile';
import { adminGuard } from './guards/admin.guard';
import { OrderTracking } from './features/order-tracking/order-tracking';
import { Customers } from './features/customers/customers';
import { OrderSuccess } from './features/order-success/order-success';
import { Contact } from './features/contact/contact';
import { Quotes } from './features/quotes/quotes';
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
    component: Checkout,
    canActivate: [authGuard]
  },

  {
    path: 'orders',
    component: Orders,
    canActivate: [authGuard]
  },
  {

    path: 'admin',

    component: Admin,

    canActivate: [adminGuard]

  },
  {
    path: 'customers',
    component: Customers,
    canActivate: [adminGuard]
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
  },
  {
    path: 'about',

    loadComponent: () =>

      import('./features/about/about')
        .then(m => m.About)
  },
  {
    path: 'team-kit-designer',
    loadComponent: () =>
      import('./features/team-kit-designer/team-kit-designer')
        .then(m => m.TeamKitDesigner)
  },

  {
    path: 'team-kit-designer/:category',
    component: KitCategory
  },
  {
    path: 'team-kit-customize/:slug',
    component: TeamKitCustomize
  },


  {
    path: 'register',
    component: Register
  },
  {
    path: 'profile',
    component: Profile,
    canActivate: [authGuard]
  },
  {
    path: 'dashboard',
    component: Dashboard
  },
  {
    path: 'profile/edit',
    component: EditProfile,
    canActivate: [authGuard]
  },
  {
    path: 'track-order/:id',
    component: OrderTracking,
    canActivate: [authGuard]
  },
  {
    path: 'order-success',
    component: OrderSuccess,
    canActivate: [authGuard]
  },
  {
    path: 'contact',
    component: Contact
  },
  {
    path: 'privacy-policy',
    loadComponent: () =>
      import('./features/privacy-policy/privacy-policy')
        .then(m => m.PrivacyPolicy)
  },

  {
    path: 'terms',
    loadComponent: () =>
      import('./features/terms/terms')
        .then(m => m.Terms)
  },

  {
    path: 'shipping-policy',
    loadComponent: () =>
      import('./features/shipping-policy/shipping-policy')
        .then(m => m.ShippingPolicy)
  },

  {
    path: 'refund-policy',
    loadComponent: () =>
      import('./features/refund-policy/refund-policy')
        .then(m => m.RefundPolicy)
  },
  {
    path: 'quotes',
    component: Quotes,
    canActivate: [adminGuard]
  },
];
