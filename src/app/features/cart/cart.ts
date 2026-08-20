import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService, CartItem } from '../../services/cart';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './cart.html',
  styleUrl: './cart.css'
})
export class Cart {

  cartItems: CartItem[] = [];

  subtotal = 0;
  couponDiscount = 0;
  couponCode = '';

  readonly freeGiftTarget = 4000;

  constructor(private cartService: CartService) {

    this.cartService.cart$.subscribe(items => {

      this.cartItems = items;

      this.calculateTotal();

    });

  }

  calculateTotal() {

    this.subtotal = this.cartService.getTotal();

  }

  get totalItems(): number {

    return this.cartItems.reduce(
      (total, item) => total + (item.quantity || 0),
      0
    );

  }

  get savings(): number {

    return this.couponDiscount;

  }

  get finalTotal(): number {

    return Math.max(
      0,
      this.subtotal - this.couponDiscount
    );

  }

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

  increase(id: string) {

    this.cartService.increaseQuantity(id);

  }

  decrease(id: string) {

    this.cartService.decreaseQuantity(id);

  }

  removeItem(id: string) {

    this.cartService.removeFromCart(id);

  }

  applyCoupon() {

    const code = this.couponCode.trim().toUpperCase();

    if (!code) {
      return;
    }

    if (code === 'SAVE10') {

      this.couponDiscount =
        Math.round(this.subtotal * 0.10);

    }

    else if (code === 'WELCOME20') {

      this.couponDiscount =
        Math.round(this.subtotal * 0.20);

    }

    else {

      this.couponDiscount = 0;

      alert('Invalid Coupon Code');

    }

  }

}