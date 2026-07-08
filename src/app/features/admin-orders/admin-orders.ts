import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { OrderService } from '../../services/order';
import { Order } from '../../models/orders';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-orders.html',
  styleUrl: './admin-orders.css'
})
export class AdminOrders implements OnInit {

  orders: Order[] = [];

  constructor(private orderService: OrderService) { }

  ngOnInit(): void {

    this.loadOrders();

  }

  loadOrders() {

    this.orderService.getOrders().subscribe({

      next: (response) => {

        this.orders = response.orders;

      },

      error: (err) => {

        console.error(err);

      }

    });


  }

  updateStatus(order: Order) {

    this.orderService.updateOrderStatus(

      order._id!,

      order.orderStatus

    ).subscribe({

      next: () => {

        alert('Order status updated successfully.');

        this.loadOrders();

      },

      error: (err) => {

        console.error(err);

        alert('Failed to update order status.');

      }

    });

  }

}