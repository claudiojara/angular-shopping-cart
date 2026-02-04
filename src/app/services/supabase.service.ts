import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';

export interface AuthUser {
  id: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private currentUserSubject = new BehaviorSubject<AuthUser | null>(null);
  public currentUser$: Observable<AuthUser | null> = this.currentUserSubject.asObservable();

  constructor() {
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.anonKey
    );

    // Check for existing session
    this.supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        this.currentUserSubject.next(this.mapUser(data.session.user));
      }
    });

    // Listen for auth changes
    this.supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        this.currentUserSubject.next(this.mapUser(session.user));
      } else {
        this.currentUserSubject.next(null);
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
    return this.currentUserSubject.value;
  }

  async signUp(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password
    });

    if (error) throw error;
    return data;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }

  async resetPassword(email: string) {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) throw error;
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }
}
