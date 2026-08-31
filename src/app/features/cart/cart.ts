import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService, CartItem } from '../../services/cart';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

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

    // ---------------------------------------------------
    // LISTEN TO CART CHANGES
    // ---------------------------------------------------

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
  // TOTAL
  // =====================================================

  calculateTotal(): void {

    this.subtotal =
      this.cartService.getTotal();

  }


  // =====================================================
  // TOTAL ITEMS
  // =====================================================

  get totalItems(): number {

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

    return this.subtotal >=
      this.freeGiftTarget;

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


    if (!code) {

      return;

    }


    // ---------------------------------------------------
    // SAVE10
    // ---------------------------------------------------

    if (code === 'SAVE10') {

      this.couponDiscount =
        Math.round(
          this.subtotal * 0.10
        );

      return;

    }


    // ---------------------------------------------------
    // WELCOME20
    // ---------------------------------------------------

    if (code === 'WELCOME20') {

      this.couponDiscount =
        Math.round(
          this.subtotal * 0.20
        );

      return;

    }


    // ---------------------------------------------------
    // INVALID
    // ---------------------------------------------------

    this.couponDiscount = 0;

    alert(
      'Invalid Coupon Code'
    );

  }


  // =====================================================
  // REMOVE COUPON
  // =====================================================

  removeCoupon(): void {

    this.couponDiscount = 0;

    this.couponCode = '';

  }


  // =====================================================
  // CHECKOUT
  // =====================================================

  goToCheckout(): void {

    // ---------------------------------------------------
    // EMPTY CART CHECK
    // ---------------------------------------------------

    if (!this.cartItems.length) {

      return;

    }


    // ---------------------------------------------------
    // CLEAR BUY NOW
    // ---------------------------------------------------

    this.cartService.clearBuyNow();


    // ---------------------------------------------------
    // GO TO CHECKOUT
    // ---------------------------------------------------

    this.router.navigate([
      '/checkout'
    ]);

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