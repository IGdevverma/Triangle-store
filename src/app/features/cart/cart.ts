import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService, CartItem } from '../../services/cart';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule
  ],
  templateUrl: './cart.html',
  styleUrl: './cart.css'
})
export class Cart {

  cartItems: CartItem[] = [];

  subtotal = 0;
  couponDiscount = 0;
  couponCode = '';

  readonly freeGiftTarget = 4000;

  constructor(
    private cartService: CartService,
    private router: Router
  ) {

    this.cartService.cart$.subscribe(items => {

      this.cartItems = items;

      this.calculateTotal();

    });

  }

  // ================= TOTAL =================

  calculateTotal(): void {

    this.subtotal =
      this.cartService.getTotal();

  }

  // ================= ITEMS =================

  get totalItems(): number {

    return this.cartItems.reduce(

      (total, item) =>
        total + (item.quantity || 0),

      0

    );

  }

  // ================= SAVINGS =================

  get savings(): number {

    return this.couponDiscount;

  }

  // ================= FINAL TOTAL =================

  get finalTotal(): number {

    return Math.max(
      0,
      this.subtotal - this.couponDiscount
    );

  }

  // ================= GIFT PROGRESS =================

  get giftProgress(): number {

    return Math.min(
      100,
      (this.subtotal / this.freeGiftTarget) * 100
    );

  }

  get remainingForGift(): number {

    return Math.max(
      0,
      this.freeGiftTarget - this.subtotal
    );

  }

  get giftUnlocked(): boolean {

    return this.subtotal >= this.freeGiftTarget;

  }

  // ================= QUANTITY =================

  increase(id: string): void {

    this.cartService.increaseQuantity(id);

  }

  decrease(id: string): void {

    this.cartService.decreaseQuantity(id);

  }

  // ================= REMOVE =================

  removeItem(id: string): void {

    this.cartService.removeFromCart(id);

  }

  // ================= COUPON =================

  applyCoupon(): void {

    const code =
      this.couponCode
        .trim()
        .toUpperCase();

    if (!code) {
      return;
    }

    if (code === 'SAVE10') {

      this.couponDiscount =
        Math.round(
          this.subtotal * 0.10
        );

    }

    else if (code === 'WELCOME20') {

      this.couponDiscount =
        Math.round(
          this.subtotal * 0.20
        );

    }

    else {

      this.couponDiscount = 0;

      alert('Invalid Coupon Code');

    }

  }

  // ================= CHECKOUT =================

  goToCheckout(): void {

    // Don't proceed if cart is empty
    if (!this.cartItems.length) {
      return;
    }

    // Cart checkout should NOT use Buy Now item
    this.cartService.clearBuyNow();

    // Go to checkout with complete cart
    this.router.navigate([
      '/checkout'
    ]);

  }

}