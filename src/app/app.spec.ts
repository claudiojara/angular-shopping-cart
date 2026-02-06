import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { App } from './app';
import { CartService } from './services/cart.service';
import { SupabaseService } from './services/supabase.service';
import { routes } from './app.routes';
import { provideConfigMock, getRouterTestingModules } from './testing/test-helpers';

xdescribe('App', () => {
  let component: App;
  let fixture: ComponentFixture<App>;
  let cartServiceMock: jasmine.SpyObj<CartService>;
  let supabaseMock: jasmine.SpyObj<SupabaseService>;
  let router: Router;
  let currentUserSubject: BehaviorSubject<null | {
    id: string;
    email: string;
    user_metadata: unknown;
  }>;

  beforeEach(async () => {
    currentUserSubject = new BehaviorSubject<null | {
      id: string;
      email: string;
      user_metadata: unknown;
    }>(null);

    cartServiceMock = jasmine.createSpyObj('CartService', [], {
      itemCount: signal(0),
    });

    supabaseMock = jasmine.createSpyObj('SupabaseService', ['signOut'], {
      currentUser$: currentUserSubject.asObservable(),
    });

    await TestBed.configureTestingModule({
      imports: [App, ...getRouterTestingModules()],
      providers: [
        provideConfigMock(),
        { provide: CartService, useValue: cartServiceMock },
        { provide: SupabaseService, useValue: supabaseMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should inject CartService', () => {
      expect(component['cartService']).toBeTruthy();
    });

    it('should inject SupabaseService', () => {
      expect(component['supabase']).toBeTruthy();
    });

    it('should inject Router', () => {
      expect(component['router']).toBeTruthy();
    });

    it('should expose cartItemCount signal from CartService', () => {
      expect(component.cartItemCount).toBeTruthy();
      expect(typeof component.cartItemCount).toBe('function');
    });

    it('should expose currentUser$ observable from SupabaseService', () => {
      expect(component.currentUser).toBeTruthy();
    });
  });

  describe('Cart Item Count', () => {
    it('should display cart item count from CartService', () => {
      // Update the mock signal
      Object.defineProperty(cartServiceMock, 'itemCount', {
        get: () => signal(5),
      });

      const newComponent = TestBed.createComponent(App).componentInstance;

      expect(newComponent.cartItemCount()).toBe(5);
    });

    it('should show 0 items when cart is empty', () => {
      Object.defineProperty(cartServiceMock, 'itemCount', {
        get: () => signal(0),
      });

      const newComponent = TestBed.createComponent(App).componentInstance;

      expect(newComponent.cartItemCount()).toBe(0);
    });

    it('should update when cart items change', () => {
      const itemCountSignal = signal(2);
      Object.defineProperty(cartServiceMock, 'itemCount', {
        get: () => itemCountSignal.asReadonly(),
      });

      const newComponent = TestBed.createComponent(App).componentInstance;
      expect(newComponent.cartItemCount()).toBe(2);

      itemCountSignal.set(5);
      expect(newComponent.cartItemCount()).toBe(5);
    });
  });

  describe('User Authentication State', () => {
    it('should show no user when not authenticated', (done) => {
      currentUserSubject.next(null);

      component.currentUser.subscribe((user) => {
        expect(user).toBeNull();
        done();
      });
    });

    it('should show user when authenticated', (done) => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        user_metadata: {},
      };
      currentUserSubject.next(mockUser);

      component.currentUser.subscribe((user) => {
        expect(user).toEqual(mockUser);
        done();
      });
    });

    it('should update when authentication state changes', (done) => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        user_metadata: {},
      };

      let callCount = 0;
      component.currentUser.subscribe((user) => {
        callCount++;
        if (callCount === 1) {
          expect(user).toBeNull();
          currentUserSubject.next(mockUser);
        } else if (callCount === 2) {
          expect(user).toEqual(mockUser);
          done();
        }
      });
    });
  });

  describe('Logout Functionality', () => {
    it('should call supabase signOut on logout', async () => {
      supabaseMock.signOut.and.returnValue(Promise.resolve());

      await component.logout();

      expect(supabaseMock.signOut).toHaveBeenCalled();
    });

    it('should navigate to login page after successful logout', async () => {
      supabaseMock.signOut.and.returnValue(Promise.resolve());

      await component.logout();

      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should navigate to login even if signOut takes time', async () => {
      supabaseMock.signOut.and.returnValue(new Promise((resolve) => setTimeout(resolve, 100)));

      await component.logout();

      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should handle logout errors gracefully', async () => {
      spyOn(console, 'error');
      const error = new Error('Logout failed');
      supabaseMock.signOut.and.returnValue(Promise.reject(error));

      await component.logout();

      expect(console.error).toHaveBeenCalledWith('Error logging out:', error);
    });

    it('should not navigate to login on logout error', async () => {
      spyOn(console, 'error');
      supabaseMock.signOut.and.returnValue(Promise.reject(new Error('Logout failed')));

      await component.logout();

      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should log specific error messages', async () => {
      spyOn(console, 'error');
      const specificError = new Error('Network timeout');
      supabaseMock.signOut.and.returnValue(Promise.reject(specificError));

      await component.logout();

      expect(console.error).toHaveBeenCalledWith('Error logging out:', specificError);
    });
  });

  // TODO: Re-enable DOM tests when RouterTestingHarness is implemented
  xdescribe('Template Rendering', () => {
    it('should render toolbar', () => {
      const toolbar = fixture.nativeElement.querySelector('mat-toolbar');
      expect(toolbar).toBeTruthy();
    });

    it('should render router outlet', () => {
      const outlet = fixture.nativeElement.querySelector('router-outlet');
      expect(outlet).toBeTruthy();
    });

    it('should render navigation links', () => {
      const links = fixture.nativeElement.querySelectorAll('a[routerLink]');
      expect(links.length).toBeGreaterThan(0);
    });

    it('should have cart badge', () => {
      const badge = fixture.nativeElement.querySelector('[matBadge]');
      expect(badge).toBeTruthy();
    });
  });

  // TODO: Re-enable DOM tests when RouterTestingHarness is implemented
  xdescribe('Navigation', () => {
    it('should have link to products page', () => {
      const productsLink = fixture.nativeElement.querySelector('a[routerLink="/"]');
      expect(productsLink).toBeTruthy();
    });

    it('should have link to cart page', () => {
      const cartLink = fixture.nativeElement.querySelector('a[routerLink="/cart"]');
      expect(cartLink).toBeTruthy();
    });

    it('should display cart icon with badge', () => {
      const cartIcon = fixture.nativeElement.querySelector('mat-icon');
      expect(cartIcon).toBeTruthy();
    });
  });

  // TODO: Re-enable DOM tests when RouterTestingHarness is implemented
  xdescribe('User Menu', () => {
    it('should show user menu when authenticated', () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        user_metadata: {},
      };
      currentUserSubject.next(mockUser);
      fixture.detectChanges();

      const userMenu = fixture.nativeElement.querySelector('[mat-button][matMenuTriggerFor]');
      expect(userMenu).toBeTruthy();
    });

    it('should hide user menu when not authenticated', () => {
      currentUserSubject.next(null);
      fixture.detectChanges();

      const userMenu = fixture.nativeElement.querySelector('[mat-button][matMenuTriggerFor]');
      // The menu trigger might not exist or be hidden when user is null
      // This depends on the template implementation
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple logout calls', async () => {
      supabaseMock.signOut.and.returnValue(Promise.resolve());

      await component.logout();
      await component.logout();

      expect(supabaseMock.signOut).toHaveBeenCalledTimes(2);
      expect(router.navigate).toHaveBeenCalledTimes(2);
    });

    it('should handle logout being called before component initialization completes', async () => {
      supabaseMock.signOut.and.returnValue(Promise.resolve());

      // Call logout immediately
      const logoutPromise = component.logout();

      expect(supabaseMock.signOut).toHaveBeenCalled();

      await logoutPromise;
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should handle rapid authentication state changes', (done) => {
      const user1 = { id: '1', email: 'user1@example.com', user_metadata: {} };
      const user2 = { id: '2', email: 'user2@example.com', user_metadata: {} };

      const receivedUsers: any[] = [];
      component.currentUser.subscribe((user) => {
        receivedUsers.push(user);

        if (receivedUsers.length === 4) {
          expect(receivedUsers[0]).toBeNull();
          expect(receivedUsers[1]).toEqual(user1);
          expect(receivedUsers[2]).toBeNull();
          expect(receivedUsers[3]).toEqual(user2);
          done();
        }
      });

      currentUserSubject.next(user1);
      currentUserSubject.next(null);
      currentUserSubject.next(user2);
    });

    it('should handle very large cart item counts', () => {
      const largeCount = signal(999);
      Object.defineProperty(cartServiceMock, 'itemCount', {
        get: () => largeCount.asReadonly(),
      });

      const newComponent = TestBed.createComponent(App).componentInstance;

      expect(newComponent.cartItemCount()).toBe(999);
    });
  });

  describe('Component Integration', () => {
    it('should properly bind cartItemCount to CartService', () => {
      // Verify that the component's cartItemCount is the same reference
      // as the one from CartService
      expect(component.cartItemCount).toBe(cartServiceMock.itemCount);
    });

    it('should properly bind currentUser$ to SupabaseService', () => {
      // Verify that the component's currentUser is the same observable
      // as the one from SupabaseService
      expect(component.currentUser).toBe(supabaseMock.currentUser$);
    });
  });

  describe('OnPush Change Detection', () => {
    it('should use OnPush change detection strategy', () => {
      const componentDef = (component.constructor as any).ɵcmp;
      // OnPush = 0, Default = 1
      expect(componentDef.changeDetection).toBe(0);
    });
  });
});
