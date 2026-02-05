import { Injectable, signal, computed, inject } from '@angular/core';
import { CartItem } from '../models/cart-item.model';
import { Product } from '../models/product.model';
import { SupabaseService } from './supabase.service';
import { ProductService } from './product.service';

interface DbCartItem {
  id: number;
  user_id: string;
  product_id: number;
  quantity: number;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private supabase = inject(SupabaseService);
  private productService = inject(ProductService);
  
  private cartItems = signal<CartItem[]>([]);
  private isLoading = signal<boolean>(false);

  // Computed signals para estado derivado
  items = this.cartItems.asReadonly();
  loading = this.isLoading.asReadonly();
  
  itemCount = computed(() => 
    this.cartItems().reduce((total, item) => total + item.quantity, 0)
  );
  
  total = computed(() => 
    this.cartItems().reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
  );

  constructor() {
    // Subscribe to auth changes and load cart
    this.supabase.currentUser$.subscribe(user => {
      if (user) {
        this.loadCartFromDb();
      } else {
        this.cartItems.set([]);
      }
    });
  }

  private async loadCartFromDb(): Promise<void> {
    if (!this.supabase.isAuthenticated()) return;

    this.isLoading.set(true);
    try {
      const user = this.supabase.getCurrentUser();
      if (!user) {
        this.cartItems.set([]);
        return;
      }

      console.log(`🔄 loadCartFromDb for user ${user.id}`);

      const { data, error } = await this.supabase.client
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id)  // ✅ Filtrar por usuario actual
        .order('created_at', { ascending: true });

      if (error) throw error;

      console.log(`📦 Loaded ${data?.length || 0} items from DB for user ${user.id}`);
      if (data) {
        console.log(`   Items:`, data.map((d: any) => `product_id=${d.product_id}, qty=${d.quantity}`));
      }

      if (data) {
        const cartItems: CartItem[] = (data as DbCartItem[])
          .map(dbItem => {
            const product = this.productService.getProductById(dbItem.product_id);
            if (product) {
              return {
                product,
                quantity: dbItem.quantity
              };
            }
            return null;
          })
          .filter((item): item is CartItem => item !== null);

        this.cartItems.set(cartItems);
        console.log(`✅ Cart updated: ${cartItems.length} items`);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async addToCart(product: Product): Promise<void> {
    const currentItems = this.cartItems();
    const existingItem = currentItems.find(item => item.product.id === product.id);

    console.log(`🔵 addToCart called for product ${product.id} (${product.name})`);
    console.log(`📦 Current cart items: ${currentItems.length}`);
    console.log(`🔍 Existing item?: ${existingItem ? 'Yes, updating quantity' : 'No, adding new'}`);

    if (existingItem) {
      await this.updateQuantity(product.id, existingItem.quantity + 1);
    } else {
      // Optimistic update
      this.cartItems.update(items => [...items, { product, quantity: 1 }]);

      // Sync to DB if authenticated
      if (this.supabase.isAuthenticated()) {
        try {
          const user = this.supabase.getCurrentUser();
          console.log(`💾 Inserting to DB: product_id=${product.id}, user_id=${user!.id}`);
          
          const { error, data } = await this.supabase.client
            .from('cart_items')
            .insert({
              user_id: user!.id,
              product_id: product.id,
              quantity: 1
            })
            .select();

          if (error) {
            console.error(`❌ Insert failed:`, error);
            // Rollback on error
            this.cartItems.update(items => 
              items.filter(item => item.product.id !== product.id)
            );
            throw error;
          }
          
          console.log(`✅ Insert successful:`, data);
        } catch (error) {
          console.error('Error adding to cart:', error);
        }
      }
    }
  }

  async removeFromCart(productId: number): Promise<void> {
    // Optimistic update
    const removedItem = this.cartItems().find(item => item.product.id === productId);
    this.cartItems.update(items => 
      items.filter(item => item.product.id !== productId)
    );

    // Sync to DB if authenticated
    if (this.supabase.isAuthenticated()) {
      try {
        const user = this.supabase.getCurrentUser();
        if (!user) return;

        const { error } = await this.supabase.client
          .from('cart_items')
          .delete()
          .eq('product_id', productId)
          .eq('user_id', user.id);  // ✅ Filtrar por usuario actual

        if (error) {
          // Rollback on error
          if (removedItem) {
            this.cartItems.update(items => [...items, removedItem]);
          }
          throw error;
        }
      } catch (error) {
        console.error('Error removing from cart:', error);
      }
    }
  }

  async updateQuantity(productId: number, quantity: number): Promise<void> {
    if (quantity <= 0) {
      await this.removeFromCart(productId);
      return;
    }

    // Optimistic update
    const oldQuantity = this.cartItems().find(item => item.product.id === productId)?.quantity;
    this.cartItems.update(items =>
      items.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      )
    );

    // Sync to DB if authenticated
    if (this.supabase.isAuthenticated()) {
      try {
        const user = this.supabase.getCurrentUser();
        if (!user) return;

        const { error } = await this.supabase.client
          .from('cart_items')
          .update({ quantity })
          .eq('product_id', productId)
          .eq('user_id', user.id);  // ✅ Filtrar por usuario actual

        if (error) {
          // Rollback on error
          if (oldQuantity !== undefined) {
            this.cartItems.update(items =>
              items.map(item =>
                item.product.id === productId
                  ? { ...item, quantity: oldQuantity }
                  : item
              )
            );
          }
          throw error;
        }
      } catch (error) {
        console.error('Error updating quantity:', error);
      }
    }
  }

  async clearCart(): Promise<void> {
    // Optimistic update
    const backup = [...this.cartItems()];
    this.cartItems.set([]);

    // Sync to DB if authenticated
    if (this.supabase.isAuthenticated()) {
      try {
        const user = this.supabase.getCurrentUser();
        const { error } = await this.supabase.client
          .from('cart_items')
          .delete()
          .eq('user_id', user!.id);

        if (error) {
          // Rollback on error
          this.cartItems.set(backup);
          throw error;
        }
      } catch (error) {
        console.error('Error clearing cart:', error);
      }
    }
  }
}
