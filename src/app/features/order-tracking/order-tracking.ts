import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Order } from '../../models/orders';
import { OrderService } from '../../services/order';

@Component({
  selector: 'app-order-tracking',
  imports: [
    CommonModule
  ],
  templateUrl: './order-tracking.html',
  styleUrl: './order-tracking.css',
})

export class OrderTracking implements OnInit {
  formatDate(date: string | Date): string {

    return new Date(date).toLocaleString('en-IN', {

      day: '2-digit',

      month: 'short',

      year: 'numeric',

      hour: '2-digit',

      minute: '2-digit'

    });

  }

  readonly steps = [

    {
      status: 'Processing',
      icon: '⚙️',
      description: 'Your order is being prepared.'
    },

    {
      status: 'Packed',
      icon: '📦',
      description: 'Your package has been packed.'
    },

    {
      status: 'Shipped',
      icon: '🚚',
      description: 'Your package is on the way.'
    },

    {
      status: 'Delivered',
      icon: '🏠',
      description: 'Delivered successfully.'
    }

  ] as const;

  order!: Order;

  constructor(

    private route: ActivatedRoute,

    private orderService: OrderService

  ) { }

  ngOnInit(): void {

    this.route.paramMap.subscribe(params => {

      const id = params.get('id');

      if (!id) return;

      this.orderService.getOrderById(id).subscribe({

        next: (response) => {

          this.order = response.order;

          console.log(this.order);

        },

        error: (err) => {

          console.error("Failed to load order", err);

        }

      });

    });

  }

  isCompleted(step: string): boolean {

    if (!this.order) return false;


    const currentIndex = this.steps.findIndex(

      s => s.status === this.order.orderStatus

    );

    const stepIndex = this.steps.findIndex(

      s => s.status === step

    );

    return stepIndex <= currentIndex;

  }

  isCurrent(step: string): boolean {

    if (!this.order) return false;

    return this.order.orderStatus === step;

  }


  getTrackingDate(status: string): string {

    if (!this.order?.trackingHistory) {

      return '';

    }

    const history = this.order.trackingHistory.find(

      (item: any) => item.status === status

    );

    return history

      ? this.formatDate(history.date)

      : '';

  }

  getEstimatedDelivery(): string {

    if (!this.order?.createdAt) {

      return '';

    }

    const date = new Date(this.order.createdAt);

    date.setDate(date.getDate() + 5);

    return date.toLocaleDateString('en-IN', {

      weekday: 'long',

      day: 'numeric',

      month: 'long'

    });

  }
}
