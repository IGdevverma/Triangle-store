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

  private cartItems: CartItem[] = [];

  private cartSubject =
    new BehaviorSubject<CartItem[]>([]);

  cart$ =
    this.cartSubject.asObservable();

  private buyNowItem: CartItem | null = null;


  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor() {

    this.loadCart();

  }


  // =====================================================
  // LOAD CART
  // =====================================================

  private loadCart(): void {

    const savedCart =
      localStorage.getItem('cart');

    if (!savedCart) {

      return;

    }

    try {

      const parsedCart =
        JSON.parse(savedCart);

      if (Array.isArray(parsedCart)) {

        this.cartItems =
          parsedCart.map(item => ({

            ...item,

            quantity:
              Number(item.quantity) > 0
                ? Number(item.quantity)
                : 1

          }));

        this.cartSubject.next(
          [...this.cartItems]
        );

      }

    } catch (error) {

      console.error(
        'Invalid cart data:',
        error
      );

      this.cartItems = [];

      localStorage.removeItem('cart');

    }

  }


  // =====================================================
  // PRODUCT ID
  // =====================================================

  private getProductId(
    product: Product
  ): string {

    return String(
      product._id || product.id
    );

  }


  // =====================================================
  // ADD TO CART
  // =====================================================

  addToCart(
    product: Product,
    quantity: number = 1,
    selectedSize?: string
  ): void {

    const productId =
      this.getProductId(product);

    if (!productId) {

      console.error(
        'Product ID missing:',
        product
      );

      return;

    }


    // -----------------------------------------------
    // VALIDATE QUANTITY
    // -----------------------------------------------

    quantity =
      Math.floor(Number(quantity));

    if (quantity < 1) {

      quantity = 1;

    }


    // -----------------------------------------------
    // STOCK CHECK
    // -----------------------------------------------

    if (
      product.stock !== undefined &&
      quantity > product.stock
    ) {

      console.warn(
        'Requested quantity exceeds stock'
      );

      quantity = product.stock;

    }

    if (quantity <= 0) {

      return;

    }


    // -----------------------------------------------
    // FIND EXISTING ITEM
    // -----------------------------------------------

    const existingItem =
      this.cartItems.find(

        item =>

          this.getProductId(item) === productId &&

          (item.selectedSize || '') ===
          (selectedSize || '')

      );


    // -----------------------------------------------
    // UPDATE EXISTING ITEM
    // -----------------------------------------------

    if (existingItem) {

      let newQuantity =
        existingItem.quantity + quantity;


      if (
        existingItem.stock !== undefined &&
        newQuantity > existingItem.stock
      ) {

        newQuantity =
          existingItem.stock;

      }


      existingItem.quantity =
        newQuantity;

    }

    // -----------------------------------------------
    // ADD NEW ITEM
    // -----------------------------------------------

    else {

      this.cartItems.push({

        ...product,

        quantity,

        selectedSize

      });

    }


    this.saveCart();

  }


  // =====================================================
  // INCREASE QUANTITY
  // =====================================================

  increaseQuantity(
    productId: string
  ): void {

    const item =
      this.cartItems.find(

        item =>
          this.getProductId(item) ===
          String(productId)

      );


    if (!item) {

      console.warn(
        'Cart item not found:',
        productId
      );

      return;

    }


    if (
      item.stock !== undefined &&
      item.quantity >= item.stock
    ) {

      return;

    }


    item.quantity++;

    this.saveCart();

  }


  // =====================================================
  // DECREASE QUANTITY
  // =====================================================

  decreaseQuantity(
    productId: string
  ): void {

    const item =
      this.cartItems.find(

        item =>
          this.getProductId(item) ===
          String(productId)

      );


    if (!item) {

      return;

    }


    if (item.quantity > 1) {

      item.quantity--;

      this.saveCart();

    }

    else {

      this.removeFromCart(productId);

    }

  }


  // =====================================================
  // REMOVE FROM CART
  // =====================================================

  removeFromCart(
    productId: string
  ): void {

    this.cartItems =
      this.cartItems.filter(

        item =>
          this.getProductId(item) !==
          String(productId)

      );


    this.saveCart();

  }


  // =====================================================
  // GET TOTAL
  // =====================================================

  getTotal(): number {

    return this.cartItems.reduce(

      (total, item) =>

        total +

        Number(item.price || 0) *

        Number(item.quantity || 0),

      0

    );

  }


  // =====================================================
  // GET CART ITEMS
  // =====================================================

  getCartItems(): CartItem[] {

    return [...this.cartItems];

  }


  // =====================================================
  // GET TOTAL ITEMS
  // =====================================================

  getTotalItems(): number {

    return this.cartItems.reduce(

      (total, item) =>

        total +
        Number(item.quantity || 0),

      0

    );

  }


  // =====================================================
  // CLEAR CART
  // =====================================================

  clearCart(): void {

    this.cartItems = [];

    this.buyNowItem = null;

    this.cartSubject.next([]);

    localStorage.removeItem('cart');

  }


  // =====================================================
  // BUY NOW
  // =====================================================

  setBuyNowItem(
    product: Product,
    quantity: number = 1,
    selectedSize?: string
  ): void {

    this.buyNowItem = {

      ...product,

      quantity,

      selectedSize

    };

  }


  getBuyNowItem(): CartItem | null {

    return this.buyNowItem;

  }


  clearBuyNow(): void {

    this.buyNowItem = null;

  }


  // =====================================================
  // SAVE CART
  // =====================================================

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