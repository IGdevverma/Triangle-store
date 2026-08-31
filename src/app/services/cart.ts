import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Product } from '../models/product';

export interface CartItem extends Product {
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
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
  // PRODUCT ID
  // =====================================================

  private getProductId(product: Product): string {

    return String(
      product._id || product.id || ''
    );

  }


  // =====================================================
  // CART ITEM KEY
  // IMPORTANT FOR CLOTHING STORE
  // Same product + different size/color = separate item
  // =====================================================

  private getCartItemKey(item: CartItem): string {

    return `${this.getProductId(item)}_${item.selectedSize || ''}_${item.selectedColor || ''}`;

  }


  // =====================================================
  // LOAD CART
  // =====================================================

  private loadCart(): void {

    const savedCart =
      localStorage.getItem('cart');

    if (!savedCart) {

      this.cartSubject.next([]);

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

        this.cartSubject.next([
          ...this.cartItems
        ]);

      }

    } catch (error) {

      console.error(
        'Invalid cart data:',
        error
      );

      this.cartItems = [];

      localStorage.removeItem('cart');

      this.cartSubject.next([]);

    }

  }


  // =====================================================
  // ADD TO CART
  // =====================================================

  addToCart(
    product: Product,
    quantity: number = 1,
    selectedSize?: string,
    selectedColor?: string
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


    // ---------------------------------------------------
    // QUANTITY VALIDATION
    // ---------------------------------------------------

    quantity =
      Math.floor(Number(quantity));

    if (quantity < 1) {

      quantity = 1;

    }


    // ---------------------------------------------------
    // STOCK CHECK
    // ---------------------------------------------------

    const stock =
      Number(product.stock ?? 0);

    if (stock <= 0) {

      console.warn(
        'Product is out of stock'
      );

      return;

    }

    if (quantity > stock) {

      quantity = stock;

    }


    // ---------------------------------------------------
    // TEMP ITEM FOR KEY
    // ---------------------------------------------------

    const newItem: CartItem = {

      ...product,

      quantity,

      selectedSize,
      selectedColor

    };


    const newKey =
      this.getCartItemKey(newItem);


    // ---------------------------------------------------
    // FIND SAME VARIANT
    // ---------------------------------------------------

    const existingItem =
      this.cartItems.find(
        item =>
          this.getCartItemKey(item) === newKey
      );


    // ---------------------------------------------------
    // EXISTING ITEM
    // ---------------------------------------------------

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


    // ---------------------------------------------------
    // NEW ITEM
    // ---------------------------------------------------

    else {

      this.cartItems.push(newItem);

    }


    this.saveCart();

  }


  // =====================================================
  // INCREASE QUANTITY
  // =====================================================

  increaseQuantity(item: CartItem): void {

    const key =
      this.getCartItemKey(item);


    const cartItem =
      this.cartItems.find(
        cart =>
          this.getCartItemKey(cart) === key
      );


    if (!cartItem) {

      console.warn(
        'Cart item not found:',
        item
      );

      return;

    }


    // ---------------------------------------------------
    // STOCK LIMIT
    // ---------------------------------------------------

    if (
      cartItem.stock !== undefined &&
      cartItem.quantity >= cartItem.stock
    ) {

      return;

    }


    cartItem.quantity++;

    this.saveCart();

  }


  // =====================================================
  // DECREASE QUANTITY
  // =====================================================

  decreaseQuantity(item: CartItem): void {

    const key =
      this.getCartItemKey(item);


    const cartItem =
      this.cartItems.find(
        cart =>
          this.getCartItemKey(cart) === key
      );


    if (!cartItem) {

      return;

    }


    if (cartItem.quantity > 1) {

      cartItem.quantity--;

      this.saveCart();

    }

    else {

      this.removeFromCart(cartItem);

    }

  }


  // =====================================================
  // REMOVE FROM CART
  // =====================================================

  removeFromCart(item: CartItem): void {

    const key =
      this.getCartItemKey(item);


    this.cartItems =
      this.cartItems.filter(
        cart =>
          this.getCartItemKey(cart) !== key
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

    return [
      ...this.cartItems
    ];

  }


  // =====================================================
  // TOTAL ITEMS
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
    selectedSize?: string,
    selectedColor?: string
  ): void {

    this.buyNowItem = {

      ...product,

      quantity,
      selectedSize,
      selectedColor

    };

  }


  // =====================================================
  // GET BUY NOW
  // =====================================================

  getBuyNowItem(): CartItem | null {

    return this.buyNowItem;

  }


  // =====================================================
  // CLEAR BUY NOW
  // =====================================================

  clearBuyNow(): void {

    this.buyNowItem = null;

  }


  // =====================================================
  // SAVE CART
  // =====================================================

  private saveCart(): void {

    this.cartSubject.next([
      ...this.cartItems
    ]);

    localStorage.setItem(
      'cart',
      JSON.stringify(this.cartItems)
    );

  }

}