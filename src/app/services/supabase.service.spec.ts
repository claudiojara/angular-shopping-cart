import { TestBed } from '@angular/core/testing';
import { SupabaseService } from './supabase.service';

describe('SupabaseService', () => {
  let service: SupabaseService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SupabaseService]
    });
    service = TestBed.inject(SupabaseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with null user', () => {
    expect(service.currentUser()).toBeNull();
  });

  it('should have isAuthenticated signal', () => {
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should expose currentUser$ observable', (done) => {
    service.currentUser$.subscribe(user => {
      expect(user).toBeNull();
      done();
    });
  });

  it('should have Supabase client', () => {
    expect(service.client).toBeTruthy();
  });

  describe('Authentication Methods', () => {
    it('should have signUp method', () => {
      expect(typeof service.signUp).toBe('function');
    });

    it('should have signIn method', () => {
      expect(typeof service.signIn).toBe('function');
    });

    it('should have signOut method', () => {
      expect(typeof service.signOut).toBe('function');
    });

    it('should have resetPassword method', () => {
      expect(typeof service.resetPassword).toBe('function');
    });

    it('should have getCurrentUser method', () => {
      expect(typeof service.getCurrentUser).toBe('function');
      expect(service.getCurrentUser()).toBeNull();
    });
  });
});
