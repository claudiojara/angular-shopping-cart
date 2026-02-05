import { Injectable, signal, computed, inject } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { ConfigService } from '../core/config.service';

export interface AuthUser {
  id: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private configService = inject(ConfigService);
  private supabase: SupabaseClient;
  
  // Private writable signal
  private _currentUser = signal<AuthUser | null>(null);
  
  // Public readonly signal
  readonly currentUser = this._currentUser.asReadonly();
  
  // Observable for backwards compatibility
  readonly currentUser$: Observable<AuthUser | null> = toObservable(this._currentUser);
  
  // Computed
  readonly isAuthenticated = computed(() => this._currentUser() !== null);

  constructor() {
    // Use runtime configuration from ConfigService
    const config = this.configService.getConfig();
    
    this.supabase = createClient(
      config.supabase.url,
      config.supabase.anonKey
    );

    // Check for existing session
    this.supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        this._currentUser.set(this.mapUser(data.session.user));
      }
    });

    // Listen for auth changes
    this.supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        this._currentUser.set(this.mapUser(session.user));
      } else {
        this._currentUser.set(null);
      }
    });
  }

  private mapUser(user: User): AuthUser {
    return {
      id: user.id,
      email: user.email!
    };
  }

  get client(): SupabaseClient {
    return this.supabase;
  }

  getCurrentUser(): AuthUser | null {
    return this._currentUser();
  }

  async signUp(email: string, password: string): Promise<unknown> {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password
    });

    if (error) throw error;
    return data;
  }

  async signIn(email: string, password: string): Promise<unknown> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  }

  async signOut(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }

  async resetPassword(email: string): Promise<void> {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) throw error;
  }
}
