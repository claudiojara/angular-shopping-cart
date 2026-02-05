import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-register',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class RegisterComponent {
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  email = signal('');
  password = signal('');
  confirmPassword = signal('');
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  hidePassword = signal(true);
  hideConfirmPassword = signal(true);

  async onSubmit(): Promise<void> {
    // Validations
    if (!this.email() || !this.password() || !this.confirmPassword()) {
      this.error.set('Por favor completa todos los campos');
      return;
    }

    if (this.password() !== this.confirmPassword()) {
      this.error.set('Las contraseñas no coinciden');
      return;
    }

    if (this.password().length < 6) {
      this.error.set('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    try {
      await this.supabase.signUp(this.email(), this.password());
      this.success.set(
        '¡Registro exitoso! Verifica tu correo electrónico para confirmar tu cuenta.',
      );

      // Auto login after 2 seconds
      setTimeout(async () => {
        try {
          await this.supabase.signIn(this.email(), this.password());
          this.router.navigate(['/']);
        } catch (err) {
          // If auto-login fails, redirect to login
          this.router.navigate(['/login']);
        }
      }, 2000);
    } catch (err: any) {
      console.error('Register error:', err);
      this.error.set(err.message || 'Error al registrar usuario. Por favor intenta de nuevo.');
    } finally {
      this.loading.set(false);
    }
  }

  togglePasswordVisibility(): void {
    this.hidePassword.set(!this.hidePassword());
  }

  toggleConfirmPasswordVisibility(): void {
    this.hideConfirmPassword.set(!this.hideConfirmPassword());
  }
}
