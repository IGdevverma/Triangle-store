import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Product } from '../models/product';

export interface CartItem extends Product {

  quantity: number;

}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems: CartItem[] = [];

  private cartSubject = new BehaviorSubject<CartItem[]>([]);

  cart$ = this.cartSubject.asObservable();

  clearCart() {

    this.cartItems = [];

    this.cartSubject.next([]);

    localStorage.removeItem('cart');

  }

  constructor() {

    const savedCart = localStorage.getItem('cart');

    if (savedCart) {

      this.cartItems = JSON.parse(savedCart);

      this.cartSubject.next(this.cartItems);

    }

  }

  addToCart(product: Product) {

    const existingItem = this.cartItems.find(

      item => item.id === product.id

    );

    if (existingItem) {

      existingItem.quantity++;

    } else {

      this.cartItems.push({

        ...product,

        quantity: 1

      });

    }

    this.cartSubject.next(this.cartItems);

    localStorage.setItem(

      'cart',

      JSON.stringify(this.cartItems)

    );

  }

  removeFromCart(productId: number) {

    this.cartItems = this.cartItems.filter(

      item => item.id !== productId

    );

    this.cartSubject.next(this.cartItems);

    localStorage.setItem(

      'cart',

      JSON.stringify(this.cartItems)

    );

  }


  increaseQuantity(productId: number) {

    const item = this.cartItems.find(
      i => i.id === productId
    );

    if (item) {
      item.quantity++;

      this.cartSubject.next(this.cartItems);

      localStorage.setItem(
        'cart',
        JSON.stringify(this.cartItems)
      );
    }
  }

  decreaseQuantity(productId: number) {

    const item = this.cartItems.find(

      i => i.id === productId

    );

    if (!item) return;

    if (item.quantity > 1) {

      item.quantity--;

    } else {

      this.removeFromCart(productId);

      return;

    }

    this.cartSubject.next(this.cartItems);

    localStorage.setItem(

      'cart',

      JSON.stringify(this.cartItems)

    );

  }
  getTotal(): number {

    return this.cartItems.reduce(

      (total, item) =>

        total + (item.price * item.quantity),

      0

    );

  }
  getCartItems(): CartItem[] {

    return [...this.cartItems];

  }

}