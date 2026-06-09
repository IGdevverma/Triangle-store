import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OrderService } from '../../services/order';
import { Order } from '../../models/order';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule ],
  templateUrl: './orders.html',
  styleUrl: './orders.css'
})
export class Orders {

  orders: Order[] = [];

  constructor(private orderService: OrderService) {

    this.orders = this.orderService.getOrders();

  }

}