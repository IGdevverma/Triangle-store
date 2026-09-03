import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import {
  CartService,
  CartItem
} from '../../services/cart';

@Component({
  selector: 'app-cart',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],

  templateUrl: './cart.html',
  styleUrl: './cart.css'
})
export class Cart implements OnDestroy {

  // =====================================================
  // CART ITEMS
  // =====================================================

  cartItems: CartItem[] = [];


  // =====================================================
  // TOTALS
  // =====================================================

  subtotal = 0;

  couponDiscount = 0;

  couponCode = '';

  couponMessage = '';


  // =====================================================
  // FREE GIFT
  // =====================================================

  readonly freeGiftTarget = 4000;


  // =====================================================
  // SUBSCRIPTION
  // =====================================================

  private cartSubscription?: Subscription;


  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(
    private cartService: CartService,
    private router: Router
  ) {

    this.cartSubscription =
      this.cartService.cart$.subscribe(items => {

        this.cartItems = items;

        this.calculateTotal();

      });

  }


  // =====================================================
  // CLEANUP
  // =====================================================

  ngOnDestroy(): void {

    this.cartSubscription?.unsubscribe();

  }


  // =====================================================
  // CALCULATE SUBTOTAL
  // =====================================================

  calculateTotal(): void {

    this.subtotal =
      this.cartService.getTotal();

    // Coupon ko subtotal change hone par
    // automatically recalculate karna
    this.recalculateCoupon();

  }


  // =====================================================
  // TOTAL PRODUCT UNITS
  // =====================================================

  get totalItems(): number {

    return this.cartItems.reduce(

      (total, item) => {

        return total +
          (
            Number(item.quantity || 0) *
            Number(item.packQuantity || 1)
          );

      },

      0

    );

  }


  // =====================================================
  // TOTAL CART LINES
  // =====================================================

  get totalCartItems(): number {

    return this.cartItems.reduce(

      (total, item) =>

        total +
        Number(item.quantity || 0),

      0

    );

  }


  // =====================================================
  // SAVINGS
  // =====================================================

  get savings(): number {

    return this.couponDiscount;

  }


  // =====================================================
  // FINAL TOTAL
  // =====================================================

  get finalTotal(): number {

    return Math.max(

      0,

      this.subtotal -
      this.couponDiscount

    );

  }


  // =====================================================
  // FREE GIFT PROGRESS
  // =====================================================

  get giftProgress(): number {

    if (this.freeGiftTarget <= 0) {

      return 100;

    }

    return Math.min(

      100,

      (
        this.subtotal /
        this.freeGiftTarget
      ) * 100

    );

  }


  // =====================================================
  // REMAINING FOR FREE GIFT
  // =====================================================

  get remainingForGift(): number {

    return Math.max(

      0,

      this.freeGiftTarget -
      this.subtotal

    );

  }


  // =====================================================
  // FREE GIFT UNLOCKED
  // =====================================================

  get giftUnlocked(): boolean {

    return (
      this.subtotal >=
      this.freeGiftTarget
    );

  }


  // =====================================================
  // INCREASE QUANTITY
  // =====================================================

  increase(item: CartItem): void {

    this.cartService.increaseQuantity(item);

  }


  // =====================================================
  // DECREASE QUANTITY
  // =====================================================

  decrease(item: CartItem): void {

    this.cartService.decreaseQuantity(item);

  }


  // =====================================================
  // REMOVE ITEM
  // =====================================================

  removeItem(item: CartItem): void {

    this.cartService.removeFromCart(item);

  }


  // =====================================================
  // APPLY COUPON
  // =====================================================

  applyCoupon(): void {

    const code =
      this.couponCode
        .trim()
        .toUpperCase();


    this.couponMessage = '';


    if (!code) {

      this.couponDiscount = 0;

      this.couponMessage =
        'Please enter a coupon code';

      return;

    }


    // ===================================================
    // SAVE10
    // ===================================================

    if (code === 'SAVE10') {

      this.couponDiscount =
        Math.round(
          this.subtotal * 0.10
        );

      this.couponMessage =
        'Coupon applied successfully';

      return;

    }


    // ===================================================
    // WELCOME20
    // ===================================================

    if (code === 'WELCOME20') {

      this.couponDiscount =
        Math.round(
          this.subtotal * 0.20
        );

      this.couponMessage =
        'Coupon applied successfully';

      return;

    }


    // ===================================================
    // INVALID COUPON
    // ===================================================

    this.couponDiscount = 0;

    this.couponMessage =
      'Invalid coupon code';

  }


  // =====================================================
  // RECALCULATE COUPON
  // =====================================================

  private recalculateCoupon(): void {

    const code =
      this.couponCode
        .trim()
        .toUpperCase();


    if (!code) {

      this.couponDiscount = 0;

      return;

    }


    if (code === 'SAVE10') {

      this.couponDiscount =
        Math.round(
          this.subtotal * 0.10
        );

      return;

    }


    if (code === 'WELCOME20') {

      this.couponDiscount =
        Math.round(
          this.subtotal * 0.20
        );

      return;

    }


    this.couponDiscount = 0;

  }


  // =====================================================
  // REMOVE COUPON
  // =====================================================

  removeCoupon(): void {

    this.couponDiscount = 0;

    this.couponCode = '';

    this.couponMessage = '';

  }


  // =====================================================
  // CHECKOUT
  // =====================================================

  goToCheckout(): void {

    // ---------------------------------------------------
    // EMPTY CART
    // ---------------------------------------------------

    if (!this.cartItems.length) {

      return;

    }


    // ---------------------------------------------------
    // BUY NOW CLEAR
    // ---------------------------------------------------

    this.cartService.clearBuyNow();


    // ---------------------------------------------------
    // CHECKOUT
    // ---------------------------------------------------

    this.router.navigate([
      '/checkout'
    ]);

  }


  // =====================================================
  // GET ITEM PRICE
  // =====================================================

  getItemPrice(item: CartItem): number {

    return Number(
      item.cartPrice ??
      item.price ??
      0
    );

  }


  // =====================================================
  // GET ITEM TOTAL
  // =====================================================

  getItemTotal(item: CartItem): number {

    return (
      this.getItemPrice(item) *
      Number(item.quantity || 0)
    );

  }


  // =====================================================
  // GET PACK LABEL
  // =====================================================

  getPackLabel(item: CartItem): string {

    const packQuantity =
      Number(item.packQuantity || 1);


    if (packQuantity === 1) {

      return '1 Piece';

    }


    return `${packQuantity} Pack`;

  }


  // =====================================================
  // GET VARIANT LABEL
  // =====================================================

  getVariantLabel(item: CartItem): string {

    const parts: string[] = [];


    // ---------------------------------------------------
    // SIZE
    // ---------------------------------------------------

    if (item.selectedSize) {

      parts.push(
        `Size: ${item.selectedSize}`
      );

    }


    // ---------------------------------------------------
    // SINGLE COLOR
    // ---------------------------------------------------

    if (
      item.selectedColor &&
      !item.selectedCombination
    ) {

      parts.push(
        `Color: ${item.selectedColor}`
      );

    }


    // ---------------------------------------------------
    // COLOR COMBINATION
    // ---------------------------------------------------

    if (item.selectedCombination) {

      parts.push(
        item.selectedCombination
      );

    }


    // ---------------------------------------------------
    // PACK
    // ---------------------------------------------------

    if (item.selectedPack) {

      const packLabel =
        this.getPackLabel(item);

      parts.push(packLabel);

    }


    return parts.join(' • ');

  }


  // =====================================================
  // IMAGE URL
  // =====================================================

  getImageUrl(
    image: string | undefined
  ): string {

    if (!image) {

      return 'assets/images/placeholder.png';

    }

    return image;

  }

}