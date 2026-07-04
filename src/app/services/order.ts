import { Injectable } from '@angular/core';
import { Order } from '../models/orders';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  private orders: Order[] = JSON.parse(localStorage.getItem('orders') || '[]');


  constructor() {

    const savedOrders = localStorage.getItem('orders');

    if (savedOrders) {

      this.orders = JSON.parse(savedOrders);

    }

  }

  addOrder(order: Order) {

    this.orders.push(order);

    localStorage.setItem(

      'orders',

      JSON.stringify(this.orders)

    );

  }

  getOrders(): Order[] {

    return this.orders;

  }

  updateOrderStatus(orderId: string, status: string) {

    const order = this.orders.find(o => o.id === orderId);

    if (order) {

      order.status = status;

      localStorage.setItem(
        'orders',
        JSON.stringify(this.orders)
      );
    }
  }

}