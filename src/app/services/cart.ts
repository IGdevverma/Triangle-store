import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Product } from '../models/product';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  private cartItems: Product[] = [];

  private cartSubject = new BehaviorSubject<Product[]>([]);

  cart$ = this.cartSubject.asObservable();

  constructor() {

    const savedCart = localStorage.getItem('cart');

    if (savedCart) {

      this.cartItems = JSON.parse(savedCart);

      this.cartSubject.next(this.cartItems);

    }

  }

  addToCart(product: Product) {
    this.cartItems.push(product);
    this.cartSubject.next(this.cartItems);
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

  getTotal(): number {

    return this.cartItems.reduce(

      (total, item) => total + item.price,

      0

    );

  }

}