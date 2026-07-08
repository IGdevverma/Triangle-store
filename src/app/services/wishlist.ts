import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Product } from '../models/product';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {

  private wishlistItems: Product[] = [];

  private wishlistSubject = new BehaviorSubject<Product[]>([]);

  wishlist$ = this.wishlistSubject.asObservable();

  constructor() {

    const savedWishlist = localStorage.getItem('wishlist');

    if (savedWishlist) {

      this.wishlistItems = JSON.parse(savedWishlist);

      this.wishlistSubject.next(this.wishlistItems);

    }

  }

  addToWishlist(product: Product) {

    const exists = this.wishlistItems.find(
      item => item.id === product.id
    );

    if (!exists) {

      this.wishlistItems.push(product);

      this.updateWishlist();

    }

  }

  removeFromWishlist(id: string) {

    this.wishlistItems = this.wishlistItems.filter(
      item => item.id !== id
    );

    this.updateWishlist();

  }

  isInWishlist(id: string): boolean {

    return this.wishlistItems.some(
      item => item.id === id
    );

  }

  getWishlist() {

    return this.wishlistItems;

  }

  private updateWishlist() {

    this.wishlistSubject.next(this.wishlistItems);

    localStorage.setItem(
      'wishlist',
      JSON.stringify(this.wishlistItems)
    );

  }

}