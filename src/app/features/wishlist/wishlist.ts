import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Product } from '../../models/product';
import { WishlistService } from '../../services/wishlist';
import { CartService } from '../../services/cart';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './wishlist.html',
  styleUrl: './wishlist.css'
})
export class Wishlist {

  wishlistItems: Product[] = [];

  constructor(
    private wishlistService: WishlistService,
    private cartService: CartService
  ) {

    this.wishlistService.wishlist$.subscribe(items => {

      this.wishlistItems = items;

    });

  }

  remove(id: number) {

    this.wishlistService.removeFromWishlist(id);

  }

  moveToCart(product: Product) {

    this.cartService.addToCart(product);

    this.wishlistService.removeFromWishlist(product.id);

    this.wishlistItems = this.wishlistService.getWishlist();

    alert(product.name + ' moved to cart');
  }

}