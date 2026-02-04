import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RegisterComponent } from './register';
import { SupabaseService } from '../../services/supabase.service';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let supabaseMock: jasmine.SpyObj<SupabaseService>;
  let routerMock: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    supabaseMock = jasmine.createSpyObj('SupabaseService', ['signUp', 'signIn']);
    routerMock = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([]),
        { provide: SupabaseService, useValue: supabaseMock },
        { provide: Router, useValue: routerMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initial State', () => {
    it('should initialize with empty email, password, and confirmPassword', () => {
      expect(component.email()).toBe('');
      expect(component.password()).toBe('');
      expect(component.confirmPassword()).toBe('');
    });

    it('should initialize with loading as false', () => {
      expect(component.loading()).toBe(false);
    });

    it('should initialize with no error or success messages', () => {
      expect(component.error()).toBeNull();
      expect(component.success()).toBeNull();
    });

    it('should initialize with both password fields hidden', () => {
      expect(component.hidePassword()).toBe(true);
      expect(component.hideConfirmPassword()).toBe(true);
    });
  });

  describe('Form Validation - Empty Fields', () => {
    it('should show error when email is empty', async () => {
      component.email.set('');
      component.password.set('password123');
      component.confirmPassword.set('password123');

      await component.onSubmit();

      expect(component.error()).toBe('Por favor completa todos los campos');
      expect(supabaseMock.signUp).not.toHaveBeenCalled();
    });

    it('should show error when password is empty', async () => {
      component.email.set('test@example.com');
      component.password.set('');
      component.confirmPassword.set('password123');

      await component.onSubmit();

      expect(component.error()).toBe('Por favor completa todos los campos');
      expect(supabaseMock.signUp).not.toHaveBeenCalled();
    });

    it('should show error when confirmPassword is empty', async () => {
      component.email.set('test@example.com');
      component.password.set('password123');
      component.confirmPassword.set('');

      await component.onSubmit();

      expect(component.error()).toBe('Por favor completa todos los campos');
      expect(supabaseMock.signUp).not.toHaveBeenCalled();
    });

    it('should show error when all fields are empty', async () => {
      component.email.set('');
      component.password.set('');
      component.confirmPassword.set('');

      await component.onSubmit();

      expect(component.error()).toBe('Por favor completa todos los campos');
      expect(supabaseMock.signUp).not.toHaveBeenCalled();
    });
  });

  describe('Form Validation - Password Mismatch', () => {
    it('should show error when passwords do not match', async () => {
      component.email.set('test@example.com');
      component.password.set('password123');
      component.confirmPassword.set('password456');

      await component.onSubmit();

      expect(component.error()).toBe('Las contraseñas no coinciden');
      expect(supabaseMock.signUp).not.toHaveBeenCalled();
    });

    it('should show error when passwords differ in case', async () => {
      component.email.set('test@example.com');
      component.password.set('Password123');
      component.confirmPassword.set('password123');

      await component.onSubmit();

      expect(component.error()).toBe('Las contraseñas no coinciden');
      expect(supabaseMock.signUp).not.toHaveBeenCalled();
    });
  });

  describe('Form Validation - Password Length', () => {
    it('should show error when password is too short (less than 6 characters)', async () => {
      component.email.set('test@example.com');
      component.password.set('12345');
      component.confirmPassword.set('12345');

      await component.onSubmit();

      expect(component.error()).toBe('La contraseña debe tener al menos 6 caracteres');
      expect(supabaseMock.signUp).not.toHaveBeenCalled();
    });

    it('should accept password with exactly 6 characters', async () => {
      component.email.set('test@example.com');
      component.password.set('123456');
      component.confirmPassword.set('123456');
      supabaseMock.signUp.and.returnValue(Promise.resolve());
      supabaseMock.signIn.and.returnValue(Promise.resolve());

      await component.onSubmit();

      expect(component.error()).not.toBe('La contraseña debe tener al menos 6 caracteres');
      expect(supabaseMock.signUp).toHaveBeenCalled();
    });

    it('should accept password with more than 6 characters', async () => {
      component.email.set('test@example.com');
      component.password.set('password123');
      component.confirmPassword.set('password123');
      supabaseMock.signUp.and.returnValue(Promise.resolve());
      supabaseMock.signIn.and.returnValue(Promise.resolve());

      await component.onSubmit();

      expect(component.error()).not.toBe('La contraseña debe tener al menos 6 caracteres');
      expect(supabaseMock.signUp).toHaveBeenCalled();
    });
  });

  describe('Successful Registration', () => {
    beforeEach(() => {
      component.email.set('test@example.com');
      component.password.set('password123');
      component.confirmPassword.set('password123');
      supabaseMock.signUp.and.returnValue(Promise.resolve());
      supabaseMock.signIn.and.returnValue(Promise.resolve());
    });

    it('should call signUp with correct credentials', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      
      await component.onSubmit();

      expect(supabaseMock.signUp).toHaveBeenCalledWith(email, password);
    });

    it('should show success message after registration', async () => {
      await component.onSubmit();

      expect(component.success()).toBe('¡Registro exitoso! Verifica tu correo electrónico para confirmar tu cuenta.');
    });

    it('should set loading to true during registration', async () => {
      let loadingDuringCall = false;
      supabaseMock.signUp.and.callFake(async () => {
        loadingDuringCall = component.loading();
        return Promise.resolve();
      });

      await component.onSubmit();

      expect(loadingDuringCall).toBe(true);
    });

    it('should set loading to false after registration', async () => {
      await component.onSubmit();

      expect(component.loading()).toBe(false);
    });

    it('should clear error and success messages before submission', async () => {
      component.error.set('Previous error');
      component.success.set('Previous success');

      await component.onSubmit();

      // During submission, both should be cleared
      expect(component.error()).toBeNull();
    });

    it('should attempt auto-login after 2 seconds', fakeAsync(() => {
      const email = 'test@example.com';
      const password = 'password123';

      component.onSubmit();
      tick(2000);

      expect(supabaseMock.signIn).toHaveBeenCalledWith(email, password);
    }));

    it('should navigate to home page after successful auto-login', fakeAsync(() => {
      component.onSubmit();
      tick(2000);

      expect(routerMock.navigate).toHaveBeenCalledWith(['/']);
    }));

    it('should navigate to login page if auto-login fails', fakeAsync(() => {
      supabaseMock.signIn.and.returnValue(Promise.reject(new Error('Auto-login failed')));

      component.onSubmit();
      tick(2000);

      expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
    }));
  });

  describe('Failed Registration', () => {
    beforeEach(() => {
      component.email.set('test@example.com');
      component.password.set('password123');
      component.confirmPassword.set('password123');
    });

    it('should show error message on registration failure', async () => {
      const errorMessage = 'Email already exists';
      supabaseMock.signUp.and.returnValue(
        Promise.reject(new Error(errorMessage))
      );

      await component.onSubmit();

      expect(component.error()).toBe(errorMessage);
    });

    it('should show default error when error message is not available', async () => {
      supabaseMock.signUp.and.returnValue(
        Promise.reject({})
      );

      await component.onSubmit();

      expect(component.error()).toBe('Error al registrar usuario. Por favor intenta de nuevo.');
    });

    it('should not show success message on registration failure', async () => {
      supabaseMock.signUp.and.returnValue(
        Promise.reject(new Error('Registration failed'))
      );

      await component.onSubmit();

      expect(component.success()).toBeNull();
    });

    it('should set loading to false after failed registration', async () => {
      supabaseMock.signUp.and.returnValue(
        Promise.reject(new Error('Registration failed'))
      );

      await component.onSubmit();

      expect(component.loading()).toBe(false);
    });

    it('should not navigate on registration failure', async () => {
      supabaseMock.signUp.and.returnValue(
        Promise.reject(new Error('Registration failed'))
      );

      await component.onSubmit();

      expect(routerMock.navigate).not.toHaveBeenCalled();
    });

    it('should log error to console on registration failure', async () => {
      spyOn(console, 'error');
      const error = new Error('Network error');
      
      supabaseMock.signUp.and.returnValue(Promise.reject(error));

      await component.onSubmit();

      expect(console.error).toHaveBeenCalledWith('Register error:', error);
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

    it('should toggle confirm password visibility from hidden to visible', () => {
      expect(component.hideConfirmPassword()).toBe(true);

      component.toggleConfirmPasswordVisibility();

      expect(component.hideConfirmPassword()).toBe(false);
    });

    it('should toggle confirm password visibility from visible to hidden', () => {
      component.hideConfirmPassword.set(false);

      component.toggleConfirmPasswordVisibility();

      expect(component.hideConfirmPassword()).toBe(true);
    });

    it('should toggle password and confirm password independently', () => {
      component.togglePasswordVisibility();
      expect(component.hidePassword()).toBe(false);
      expect(component.hideConfirmPassword()).toBe(true);

      component.toggleConfirmPasswordVisibility();
      expect(component.hidePassword()).toBe(false);
      expect(component.hideConfirmPassword()).toBe(false);
    });
  });

  describe('Template Rendering', () => {
    it('should render email input field', () => {
      const emailInput = fixture.nativeElement.querySelector('input[type="email"]');
      expect(emailInput).toBeTruthy();
    });

    it('should render password input fields', () => {
      const passwordInputs = fixture.nativeElement.querySelectorAll('input[type="password"]');
      expect(passwordInputs.length).toBeGreaterThanOrEqual(1);
    });

    it('should render submit button', () => {
      const submitButton = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(submitButton).toBeTruthy();
    });

    it('should render link to login page', () => {
      const loginLink = fixture.nativeElement.querySelector('a[routerLink="/login"]');
      expect(loginLink).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle whitespace-only email', async () => {
      component.email.set('   ');
      component.password.set('password123');
      component.confirmPassword.set('password123');

      await component.onSubmit();

      expect(component.error()).toBe('Por favor completa todos los campos');
    });

    it('should handle whitespace-only passwords', async () => {
      component.email.set('test@example.com');
      component.password.set('   ');
      component.confirmPassword.set('   ');

      await component.onSubmit();

      expect(component.error()).toBe('Por favor completa todos los campos');
    });

    it('should validate password length before checking match', async () => {
      component.email.set('test@example.com');
      component.password.set('12345');
      component.confirmPassword.set('12345');

      await component.onSubmit();

      expect(component.error()).toBe('La contraseña debe tener al menos 6 caracteres');
    });

    it('should handle very long passwords', async () => {
      const longPassword = 'a'.repeat(100);
      component.email.set('test@example.com');
      component.password.set(longPassword);
      component.confirmPassword.set(longPassword);
      supabaseMock.signUp.and.returnValue(Promise.resolve());
      supabaseMock.signIn.and.returnValue(Promise.resolve());

      await component.onSubmit();

      expect(supabaseMock.signUp).toHaveBeenCalledWith('test@example.com', longPassword);
    });
  });

  describe('Validation Order', () => {
    it('should check for empty fields before password match', async () => {
      component.email.set('');
      component.password.set('password1');
      component.confirmPassword.set('password2');

      await component.onSubmit();

      expect(component.error()).toBe('Por favor completa todos los campos');
    });

    it('should check for password match before password length', async () => {
      component.email.set('test@example.com');
      component.password.set('123');
      component.confirmPassword.set('456');

      await component.onSubmit();

      expect(component.error()).toBe('Las contraseñas no coinciden');
    });

    it('should validate in correct order: empty > match > length', async () => {
      // First, empty check
      component.email.set('');
      component.password.set('123');
      component.confirmPassword.set('123');
      await component.onSubmit();
      expect(component.error()).toBe('Por favor completa todos los campos');

      // Then, match check
      component.email.set('test@example.com');
      component.password.set('123');
      component.confirmPassword.set('456');
      await component.onSubmit();
      expect(component.error()).toBe('Las contraseñas no coinciden');

      // Finally, length check
      component.password.set('123');
      component.confirmPassword.set('123');
      await component.onSubmit();
      expect(component.error()).toBe('La contraseña debe tener al menos 6 caracteres');
    });
  });
});
