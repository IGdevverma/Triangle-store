import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService, CartItem } from '../../services/cart';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart.html',
  styleUrl: './cart.css'
})
export class Cart {

  cartItems: CartItem[] = [];
  total = 0;
  

  constructor(private cartService: CartService) {



    this.cartService.cart$.subscribe(items => {
      this.cartItems = items;
      this.total = this.cartService.getTotal();
    });

  }

  removeItem(id: number) {
    this.cartService.removeFromCart(id);
  }
  increase(id: number) {
    this.cartService.increaseQuantity(id);
  }
  decrease(id: number) {
    this.cartService.decreaseQuantity(id);
  }





}