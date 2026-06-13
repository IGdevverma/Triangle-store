import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Product } from '../../models/product';
import { WishlistService } from '../../services/wishlist';
import { CartService } from '../../services/cart';
import { NotificationService } from '../../services/notification';
@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './wishlist.html',
  styleUrl: './wishlist.css'
})
export class Wishlist implements OnInit {

  wishlistItems: Product[] = [];

  constructor(
    private wishlistService: WishlistService,
    private cartService: CartService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {

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

    this.notificationService.show(

      product.name + ' moved to cart'

    );

  }

}