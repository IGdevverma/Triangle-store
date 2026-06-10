import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OrderService } from '../../services/order';
import { Order } from '../../models/orders';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule ],
  templateUrl: './order.html',
  styleUrl: './order.css'
})
export class Orders {

  orders: Order[] = [];

  constructor(private orderService: OrderService) {

    this.orders = this.orderService.getOrders();

  }

}