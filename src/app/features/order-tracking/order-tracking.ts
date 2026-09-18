import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Order } from '../../models/orders';
import { OrderService } from '../../services/order';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-order-tracking',
  imports: [
    CommonModule, FormsModule
  ],
  templateUrl: './order-tracking.html',
  styleUrl: './order-tracking.css',
})

export class OrderTracking implements OnInit {
  formatDate(
    date: string | Date | null | undefined
  ): string {

    if (!date) {
      return '';
    }

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


  loading = true;
  errorMessage = '';

  showCancellationModal = false;
  cancellationReason = '';
  isCancelling = false;

  readonly cancellationReasons = [
    'Changed my mind',
    'Ordered by mistake',
    'Found a better option',
    'Delivery taking too long',
    'Other'
  ];

  constructor(

    private route: ActivatedRoute,

    private orderService: OrderService

  ) { }

  ngOnInit(): void {

    this.route.paramMap.subscribe(params => {

      const id = params.get('id');

      if (!id) {
        this.loading = false;
        this.errorMessage = 'Invalid order ID.';
        return;
      }

      this.orderService.getOrderById(id).subscribe({

        next: (response) => {

          this.order = response.order;

          this.loading = false;

          this.errorMessage = '';

          console.log(this.order);

        },

        error: (err) => {

          console.error(
            'Failed to load order',
            err
          );

          this.loading = false;

          this.errorMessage =
            err?.error?.message ||
            'Unable to load your order. Please try again.';

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
    const history = this.order.trackingHistory
      .filter(
        (item: any) => item.status === status
      )
      .sort(
        (a: any, b: any) =>
          new Date(b.date).getTime() -
          new Date(a.date).getTime()
      )[0];
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

  canCancelOrder(): boolean {

    if (!this.order) {
      return false;
    }

    return (
      this.order.orderStatus === 'Processing' ||
      this.order.orderStatus === 'Packed'
    );
  }


  openCancellationModal(): void {

    if (!this.canCancelOrder()) {
      return;
    }

    this.cancellationReason = '';
    this.showCancellationModal = true;
  }


  closeCancellationModal(): void {

    if (this.isCancelling) {
      return;
    }

    this.showCancellationModal = false;
    this.cancellationReason = '';
  }


  confirmCancellation(): void {

    if (!this.order?._id) {
      return;
    }

    const reason =
      this.cancellationReason.trim();

    if (!reason) {
      return;
    }

    this.isCancelling = true;

    this.orderService
      .updateOrderStatus(
        this.order._id,
        'Cancelled',
        reason
      )
      .subscribe({

        next: (response) => {

          this.order = response.order;

          this.isCancelling = false;

          this.showCancellationModal = false;

          this.cancellationReason = '';

        },

        error: (error) => {

          console.error(
            'Order cancellation failed:',
            error
          );

          this.isCancelling = false;

          this.errorMessage =
            error?.error?.message ||
            'Unable to cancel the order. Please try again.';

        }

      });
  }
}
