import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

// Optimización #5: Lazy loading de rutas para reducir bundle inicial
export const routes: Routes = [
  { path: '', redirectTo: '/products', pathMatch: 'full' },
  {
    path: 'products',
    loadComponent: () =>
      import('./components/product-list/product-list').then((m) => m.ProductList),
  },
  {
    path: 'cart',
    loadComponent: () => import('./components/cart/cart').then((m) => m.Cart),
  },
  {
    path: 'checkout',
    loadComponent: () => import('./components/checkout/checkout.page').then((m) => m.CheckoutPage),
    canActivate: [authGuard], // Requires authentication
  },
  {
    path: 'payment/callback',
    loadComponent: () =>
      import('./components/checkout/payment-callback.page').then((m) => m.PaymentCallbackPage),
    // No auth guard - needs to accept Flow redirects
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./components/register/register').then((m) => m.RegisterComponent),
  },
  {
    path: 'contact',
    loadComponent: () => import('./components/contact/contact.page').then((m) => m.ContactPage),
  },
];
