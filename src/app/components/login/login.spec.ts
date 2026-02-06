import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { LoginComponent } from './login';
import { SupabaseService } from '../../services/supabase.service';
import { provideConfigMock, provideActivatedRouteMock } from '../../testing/test-helpers';

xdescribe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let supabaseMock: jasmine.SpyObj<SupabaseService>;
  let routerMock: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    supabaseMock = jasmine.createSpyObj('SupabaseService', ['signIn']);
    routerMock = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideConfigMock(),
        provideActivatedRouteMock(),
        { provide: SupabaseService, useValue: supabaseMock },
        { provide: Router, useValue: routerMock },
      ],
      schemas: [NO_ERRORS_SCHEMA], // Ignore template errors for routerLink
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initial State', () => {
    it('should initialize with empty email and password', () => {
      expect(component.email()).toBe('');
      expect(component.password()).toBe('');
    });

    it('should initialize with loading as false', () => {
      expect(component.loading()).toBe(false);
    });

    it('should initialize with no error', () => {
      expect(component.error()).toBeNull();
    });

    it('should initialize with hidePassword as true', () => {
      expect(component.hidePassword()).toBe(true);
    });
  });

  describe('Form Validation', () => {
    it('should show error when email is empty', async () => {
      component.email.set('');
      component.password.set('password123');

      await component.onSubmit();

      expect(component.error()).toBe('Por favor completa todos los campos');
      expect(supabaseMock.signIn).not.toHaveBeenCalled();
    });

    it('should show error when password is empty', async () => {
      component.email.set('test@example.com');
      component.password.set('');

      await component.onSubmit();

      expect(component.error()).toBe('Por favor completa todos los campos');
      expect(supabaseMock.signIn).not.toHaveBeenCalled();
    });

    it('should show error when both email and password are empty', async () => {
      component.email.set('');
      component.password.set('');

      await component.onSubmit();

      expect(component.error()).toBe('Por favor completa todos los campos');
      expect(supabaseMock.signIn).not.toHaveBeenCalled();
    });
  });

  describe('Successful Login', () => {
    it('should call signIn with correct credentials', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      component.email.set(email);
      component.password.set(password);
      supabaseMock.signIn.and.returnValue(Promise.resolve());

      await component.onSubmit();

      expect(supabaseMock.signIn).toHaveBeenCalledWith(email, password);
    });

    it('should navigate to home page on successful login', async () => {
      component.email.set('test@example.com');
      component.password.set('password123');
      supabaseMock.signIn.and.returnValue(Promise.resolve());

      await component.onSubmit();

      expect(routerMock.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should set loading to true during login', async () => {
      component.email.set('test@example.com');
      component.password.set('password123');

      let loadingDuringCall = false;
      supabaseMock.signIn.and.callFake(async () => {
        loadingDuringCall = component.loading();
        return Promise.resolve();
      });

      await component.onSubmit();

      expect(loadingDuringCall).toBe(true);
    });

    it('should set loading to false after successful login', async () => {
      component.email.set('test@example.com');
      component.password.set('password123');
      supabaseMock.signIn.and.returnValue(Promise.resolve());

      await component.onSubmit();

      expect(component.loading()).toBe(false);
    });

    it('should clear error on successful login', async () => {
      component.email.set('test@example.com');
      component.password.set('password123');
      component.error.set('Previous error');
      supabaseMock.signIn.and.returnValue(Promise.resolve());

      await component.onSubmit();

      expect(component.error()).toBeNull();
    });
  });

  describe('Failed Login', () => {
    it('should show error message on login failure', async () => {
      const errorMessage = 'Invalid credentials';
      component.email.set('test@example.com');
      component.password.set('wrongpassword');
      supabaseMock.signIn.and.returnValue(Promise.reject(new Error(errorMessage)));

      await component.onSubmit();

      expect(component.error()).toBe(errorMessage);
    });

    it('should show default error when error message is not available', async () => {
      component.email.set('test@example.com');
      component.password.set('wrongpassword');
      supabaseMock.signIn.and.returnValue(Promise.reject({}));

      await component.onSubmit();

      expect(component.error()).toBe('Error al iniciar sesión. Verifica tus credenciales.');
    });

    it('should not navigate on login failure', async () => {
      component.email.set('test@example.com');
      component.password.set('wrongpassword');
      supabaseMock.signIn.and.returnValue(Promise.reject(new Error('Invalid credentials')));

      await component.onSubmit();

      expect(routerMock.navigate).not.toHaveBeenCalled();
    });

    it('should set loading to false after failed login', async () => {
      component.email.set('test@example.com');
      component.password.set('wrongpassword');
      supabaseMock.signIn.and.returnValue(Promise.reject(new Error('Invalid credentials')));

      await component.onSubmit();

      expect(component.loading()).toBe(false);
    });

    it('should log error to console on login failure', async () => {
      spyOn(console, 'error');
      const error = new Error('Network error');

      component.email.set('test@example.com');
      component.password.set('password123');
      supabaseMock.signIn.and.returnValue(Promise.reject(error));

      await component.onSubmit();

      expect(console.error).toHaveBeenCalledWith('Login error:', error);
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should toggle password visibility from hidden to visible', () => {
      expect(component.hidePassword()).toBe(true);

      component.togglePasswordVisibility();

      expect(component.hidePassword()).toBe(false);
    });

    it('should toggle password visibility from visible to hidden', () => {
      component.hidePassword.set(false);

      component.togglePasswordVisibility();

      expect(component.hidePassword()).toBe(true);
    });

    it('should toggle password visibility multiple times', () => {
      expect(component.hidePassword()).toBe(true);

      component.togglePasswordVisibility();
      expect(component.hidePassword()).toBe(false);

      component.togglePasswordVisibility();
      expect(component.hidePassword()).toBe(true);

      component.togglePasswordVisibility();
      expect(component.hidePassword()).toBe(false);
    });
  });

  // TODO: Re-enable DOM tests when RouterTestingHarness is implemented
  xdescribe('Template Rendering', () => {
    it('should render email input field', () => {
      const emailInput = fixture.nativeElement.querySelector('input[type="email"]');
      expect(emailInput).toBeTruthy();
    });

    it('should render password input field', () => {
      const passwordInput = fixture.nativeElement.querySelector('input[type="password"]');
      expect(passwordInput).toBeTruthy();
    });

    it('should render submit button', () => {
      const submitButton = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(submitButton).toBeTruthy();
    });

    it('should render link to register page', () => {
      const registerLink = fixture.nativeElement.querySelector('a[routerLink="/register"]');
      expect(registerLink).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle whitespace-only email', async () => {
      component.email.set('   ');
      component.password.set('password123');

      await component.onSubmit();

      expect(component.error()).toBe('Por favor completa todos los campos');
    });

    it('should handle whitespace-only password', async () => {
      component.email.set('test@example.com');
      component.password.set('   ');

      await component.onSubmit();

      expect(component.error()).toBe('Por favor completa todos los campos');
    });

    it('should clear previous error before new submission', async () => {
      component.email.set('test@example.com');
      component.password.set('password123');
      component.error.set('Old error');
      supabaseMock.signIn.and.returnValue(Promise.resolve());

      await component.onSubmit();

      expect(component.error()).toBeNull();
    });
  });
});
