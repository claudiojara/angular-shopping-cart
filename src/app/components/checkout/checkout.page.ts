import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { CreateOrderRequest } from '../../models/order.model';

/**
 * Chilean regions for shipping form
 */
const CHILE_REGIONS = [
  'Región de Arica y Parinacota',
  'Región de Tarapacá',
  'Región de Antofagasta',
  'Región de Atacama',
  'Región de Coquimbo',
  'Región de Valparaíso',
  'Región Metropolitana',
  "Región del Libertador General Bernardo O'Higgins",
  'Región del Maule',
  'Región de Ñuble',
  'Región del Biobío',
  'Región de La Araucanía',
  'Región de Los Ríos',
  'Región de Los Lagos',
  'Región de Aysén del General Carlos Ibáñez del Campo',
  'Región de Magallanes y la Antártica Chilena',
];

/**
 * CheckoutPage - Checkout form with shipping info and payment initiation
 * Collects customer data and creates order before redirecting to Flow payment
 */
@Component({
  selector: 'app-checkout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatSnackBarModule,
    MatSelectModule,
  ],
  templateUrl: './checkout.page.html',
  styleUrl: './checkout.page.scss',
})
export class CheckoutPage {
  private router = inject(Router);
  private formBuilder = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  readonly cartService = inject(CartService);
  readonly orderService = inject(OrderService);

  // Local state
  readonly processing = signal(false);
  readonly regions = CHILE_REGIONS;

  // Shipping cost (fixed for now - could be dynamic based on region)
  readonly shippingCost = signal(5000); // $5.000 CLP flat rate

  // Computed values
  readonly subtotal = computed(() => this.cartService.total());
  readonly shipping = computed(() => {
    // Free shipping over $50.000
    return this.subtotal() >= 50000 ? 0 : this.shippingCost();
  });
  readonly total = computed(() => this.subtotal() + this.shipping());
  readonly hasItems = computed(() => this.cartService.itemCount() > 0);

  // Checkout form
  checkoutForm!: FormGroup;

  constructor() {
    // Redirect if cart is empty
    if (!this.hasItems()) {
      this.router.navigate(['/products']);
      return;
    }

    // Initialize form
    this.checkoutForm = this.formBuilder.group({
      shippingName: ['', [Validators.required, Validators.minLength(3)]],
      shippingEmail: ['', [Validators.required, Validators.email]],
      shippingPhone: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{8,15}$/)]],
      shippingAddress: ['', [Validators.required, Validators.minLength(10)]],
      shippingCity: ['', Validators.required],
      shippingRegion: ['', Validators.required],
      shippingComuna: [''],
      shippingNotes: [''],
    });
  }

  /**
   * Handle checkout form submission
   * Creates order and initiates Flow payment
   */
  async onSubmit(): Promise<void> {
    if (this.checkoutForm.invalid || this.processing()) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    this.processing.set(true);

    try {
      // 1. Prepare order request
      const formValue = this.checkoutForm.value;
      const orderRequest: CreateOrderRequest = {
        items: this.cartService.items().map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.product.price,
        })),
        subtotalAmount: this.subtotal(),
        shippingAmount: this.shipping(),
        totalAmount: this.total(),
        shippingName: formValue.shippingName,
        shippingEmail: formValue.shippingEmail,
        shippingPhone: formValue.shippingPhone,
        shippingAddress: formValue.shippingAddress,
        shippingCity: formValue.shippingCity,
        shippingRegion: formValue.shippingRegion,
        shippingComuna: formValue.shippingComuna,
        shippingNotes: formValue.shippingNotes,
      };

      // 2. Create order in database
      const order = await this.orderService.createOrder(orderRequest);

      if (!order) {
        throw new Error('No se pudo crear la orden');
      }

      // 3. Initiate Flow payment
      const paymentResponse = await this.orderService.initiateFlowPayment(order.id);

      if (!paymentResponse || !paymentResponse.paymentUrl) {
        throw new Error('No se pudo iniciar el pago con Flow');
      }

      // Save flow token and order ID to localStorage for callback verification
      if (paymentResponse.token) {
        localStorage.setItem('pending_flow_token', paymentResponse.token);
        localStorage.setItem('pending_order_id', order.id.toString());
        console.log('💾 Saved flow token to localStorage for callback verification');
      }

      // 4. Redirect to Flow payment page
      window.location.href = paymentResponse.paymentUrl;
    } catch (error) {
      console.error('Error processing checkout:', error);
      this.snackBar.open(
        error instanceof Error ? error.message : 'Error al procesar el pago',
        'Cerrar',
        {
          duration: 5000,
          panelClass: ['snack-error'],
        },
      );
      this.processing.set(false);
    }
  }

  /**
   * Format price for display
   */
  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(price);
  }

  /**
   * Get form field error message
   */
  getErrorMessage(fieldName: string): string {
    const field = this.checkoutForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) return 'Este campo es requerido';
    if (field.errors['email']) return 'Email inválido';
    if (field.errors['minlength']) {
      const min = field.errors['minlength'].requiredLength;
      return `Mínimo ${min} caracteres`;
    }
    if (field.errors['pattern']) return 'Formato inválido';

    return '';
  }

  /**
   * Cancel and return to cart
   */
  cancel(): void {
    this.router.navigate(['/cart']);
  }
}
