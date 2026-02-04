import { Routes } from '@angular/router';
import { ProductList } from './components/product-list/product-list';
import { Cart } from './components/cart/cart';
import { LoginComponent } from './components/login/login';
import { RegisterComponent } from './components/register/register';

export const routes: Routes = [
  { path: '', redirectTo: '/products', pathMatch: 'full' },
  { path: 'products', component: ProductList },
  { path: 'cart', component: Cart },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent }
];
