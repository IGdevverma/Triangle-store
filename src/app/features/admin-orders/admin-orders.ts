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
  totalOrders = 0;
  pendingOrders = 0;
  shippedOrders = 0;
  deliveredOrders = 0;
  filteredOrders: Order[] = [];

  searchTerm = '';

  selectedStatus = '';


  constructor(private orderService: OrderService) { }


  calculateStats() {

    this.totalOrders = this.orders.length;

    this.pendingOrders = this.orders.filter(
      o => o.orderStatus === 'Processing'
    ).length;

    this.shippedOrders = this.orders.filter(
      o => o.orderStatus === 'Shipped'
    ).length;

    this.deliveredOrders = this.orders.filter(
      o => o.orderStatus === 'Delivered'
    ).length;

  }

  ngOnInit(): void {

    this.loadOrders();

  }

  loadOrders() {

    this.orderService.getOrders().subscribe({


      next: (response) => {

        this.orders = response.orders;
        this.filteredOrders = [...this.orders];
        this.calculateStats();

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

  filterOrders() {

    this.filteredOrders = this.orders.filter(order => {

      const matchesSearch =
        order._id?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        order.customerName?.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesStatus =
        this.selectedStatus === '' ||
        order.orderStatus === this.selectedStatus;

      return matchesSearch && matchesStatus;

    });

  }

}