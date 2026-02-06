import { Component, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { CartService } from './services/cart.service';
import { SupabaseService } from './services/supabase.service';
import { SeoService } from './services/seo.service';
import { Footer } from './components/footer/footer';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatMenuModule,
    MatDividerModule,
    Footer,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private cartService = inject(CartService);
  private supabase = inject(SupabaseService);
  private router = inject(Router);
  private seoService = inject(SeoService);

  cartItemCount = this.cartService.itemCount;
  currentUser = this.supabase.currentUser$;
  isMobileMenuOpen = signal(false);

  constructor() {
    // Initialize SEO with default configuration
    this.seoService.updateSeo();
    this.seoService.addOrganizationSchema();
    this.seoService.addWebSiteSchema();
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((value) => !value);
    // Prevent body scroll when menu is open
    document.body.style.overflow = this.isMobileMenuOpen() ? 'hidden' : '';
  }

  async logout(): Promise<void> {
    try {
      await this.supabase.signOut();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }
}
