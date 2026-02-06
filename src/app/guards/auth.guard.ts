import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

/**
 * Guard to protect routes that require authentication
 * Redirects to login page if user is not authenticated
 */
export const authGuard: CanActivateFn = () => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  if (!supabase.isAuthenticated()) {
    // Store the attempted URL for redirecting after login
    const currentUrl = router.url;
    router.navigate(['/login'], {
      queryParams: { returnUrl: currentUrl },
    });
    return false;
  }

  return true;
};
