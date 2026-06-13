import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OrderService } from '../../services/order';
import { Order } from '../../models/orders';
import { CartService } from '../../services/cart';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order.html',
  styleUrl: './order.css'
})
export class Orders {

  orders: Order[] = [];

  constructor(
    private orderService: OrderService,
    private cartService: CartService
  ) {

    this.orders = this.orderService.getOrders();

  }

  buyAgain(order: Order) {

    order.items.forEach(item => {

      this.cartService.addToCart(item);

    });

    alert('Products added to cart');

  }

  cancelOrder(orderId: string) {

    this.orders = this.orders.map(order => {

      if (order.id === orderId) {

        return {
          ...order,
          status: 'Cancelled'
        };

      }

      return order;

    });

    localStorage.setItem(
      'orders',
      JSON.stringify(this.orders)
    );

  }

}