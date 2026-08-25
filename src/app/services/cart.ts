import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Product } from '../models/product';

export interface CartItem extends Product {
  quantity: number;
  selectedSize?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {

  // ================= NORMAL CART =================

  private cartItems: CartItem[] = [];

  private cartSubject =
    new BehaviorSubject<CartItem[]>([]);

  cart$ = this.cartSubject.asObservable();


  // ================= BUY NOW =================

  private buyNowItem: CartItem | null = null;


  // ================= CONSTRUCTOR =================

  constructor() {

    const savedCart =
      localStorage.getItem('cart');

    if (savedCart) {

      try {

        this.cartItems =
          JSON.parse(savedCart);

        this.cartSubject.next(
          this.cartItems
        );

      } catch (error) {

        console.error(
          'Error loading cart:',
          error
        );

        this.cartItems = [];

      }

    }

  }


  // ================= ADD TO CART =================

  addToCart(
    product: Product,
    quantity: number = 1,
    selectedSize?: string
  ): void {

    const existingItem =
      this.cartItems.find(
        item => item.id === product.id
      );

    if (existingItem) {

      existingItem.quantity += quantity;

      if (selectedSize) {
        existingItem.selectedSize =
          selectedSize;
      }

    } else {

      this.cartItems.push({

        ...product,

        quantity,

        selectedSize

      });

    }

    this.saveCart();

  }


  // ================= BUY NOW =================

  buyNow(
    product: Product,
    quantity: number = 1,
    selectedSize?: string
  ): void {

    this.buyNowItem = {

      ...product,

      quantity,

      selectedSize

    };

    localStorage.setItem(
      'buyNowItem',
      JSON.stringify(this.buyNowItem)
    );

  }


  // ================= GET BUY NOW ITEM =================

  getBuyNowItem(): CartItem | null {

    if (this.buyNowItem) {

      return {
        ...this.buyNowItem
      };

    }

    const savedBuyNow =
      localStorage.getItem('buyNowItem');

    if (!savedBuyNow) {
      return null;
    }

    try {

      this.buyNowItem =
        JSON.parse(savedBuyNow);

      return {
        ...this.buyNowItem!
      };

    } catch (error) {

      console.error(
        'Error loading Buy Now item:',
        error
      );

      return null;

    }

  }


  // ================= CLEAR BUY NOW =================

  clearBuyNow(): void {

    this.buyNowItem = null;

    localStorage.removeItem(
      'buyNowItem'
    );

  }


  // ================= CLEAR CART =================

  clearCart(): void {

    this.cartItems = [];

    this.cartSubject.next([]);

    localStorage.removeItem('cart');

  }


  // ================= REMOVE ITEM =================

  removeFromCart(
    productId: string
  ): void {

    this.cartItems =
      this.cartItems.filter(
        item => item.id !== productId
      );

    this.saveCart();

  }


  // ================= INCREASE =================

  increaseQuantity(
    productId: string
  ): void {

    const item =
      this.cartItems.find(
        i => i.id === productId
      );

    if (!item) {
      return;
    }

    item.quantity++;

    this.saveCart();

  }


  // ================= DECREASE =================

  decreaseQuantity(
    productId: string
  ): void {

    const item =
      this.cartItems.find(
        i => i.id === productId
      );

    if (!item) {
      return;
    }

    if (item.quantity > 1) {

      item.quantity--;

      this.saveCart();

    } else {

      this.removeFromCart(productId);

    }

  }


  // ================= TOTAL =================

  getTotal(): number {

    return this.cartItems.reduce(

      (total, item) =>

        total +
        (Number(item.price) *
         Number(item.quantity)),

      0

    );

  }


  // ================= CART ITEMS =================

  getCartItems(): CartItem[] {

    return [
      ...this.cartItems
    ];

  }


  // ================= SAVE CART =================

  private saveCart(): void {

    this.cartSubject.next(
      [...this.cartItems]
    );

    localStorage.setItem(
      'cart',
      JSON.stringify(this.cartItems)
    );

  }

}