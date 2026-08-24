import { Component, OnInit } from '@angular/core';
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
export class Orders implements OnInit {

  orders: Order[] = [];

  isLoading = true;

  // ==========================================
  // CANCEL MODAL
  // ==========================================

  showCancelModal = false;

  selectedOrder: Order | null = null;

  selectedCancellationReason = '';

  isCancelling = false;

  cancellationReasons: string[] = [
    'Ordered by mistake',
    'Changed my mind',
    'Found a better price',
    'Product no longer needed',
    'Delivery taking too long',
    'Ordered the wrong product',
    'Other'
  ];


  constructor(
    private orderService: OrderService,
    private cartService: CartService
  ) {}


  // ==========================================
  // INIT
  // ==========================================

  ngOnInit(): void {

    this.loadOrders();

  }


  // ==========================================
  // LOAD ORDERS
  // ==========================================

  loadOrders(): void {

    this.isLoading = true;

    this.orderService.getOrders().subscribe({

      next: (response) => {

        this.orders = response.orders || [];

        this.isLoading = false;

      },

      error: (error) => {

        console.error(
          'Failed to load orders:',
          error
        );

        this.isLoading = false;

      }

    });

  }


  // ==========================================
  // BUY AGAIN
  // ==========================================

  buyAgain(order: Order): void {

    if (!order.items?.length) {
      return;
    }

    order.items.forEach(item => {

      this.cartService.addToCart(item);

    });

    alert('Products added to cart.');

  }


  // ==========================================
  // OPEN CANCEL MODAL
  // ==========================================

  openCancelModal(order: Order): void {

    if (!this.canCancel(order)) {
      return;
    }

    this.selectedOrder = order;

    this.selectedCancellationReason = '';

    this.showCancelModal = true;

    document.body.style.overflow = 'hidden';

  }


  // ==========================================
  // CLOSE CANCEL MODAL
  // ==========================================

  closeCancelModal(): void {

    if (this.isCancelling) {
      return;
    }

    this.showCancelModal = false;

    this.selectedOrder = null;

    this.selectedCancellationReason = '';

    document.body.style.overflow = '';

  }


  // ==========================================
  // SELECT CANCELLATION REASON
  // ==========================================

  selectCancellationReason(reason: string): void {

    if (this.isCancelling) {
      return;
    }

    this.selectedCancellationReason = reason;

  }


  // ==========================================
  // CONFIRM CANCELLATION
  // ==========================================

  confirmCancellation(): void {

    if (!this.selectedOrder?._id) {
      return;
    }

    if (!this.selectedCancellationReason) {
      return;
    }

    if (!this.canCancel(this.selectedOrder)) {
      return;
    }

    this.isCancelling = true;

    const orderId = this.selectedOrder._id;

    const cancellationReason =
      this.selectedCancellationReason;


    this.orderService
      .updateOrderStatus(
        orderId,
        'Cancelled',
        cancellationReason
      )
      .subscribe({

        next: (response) => {

          const updatedOrder =
            response?.order;

          this.orders = this.orders.map(order => {

            if (order._id !== orderId) {
              return order;
            }

            return {
              ...order,

              ...(updatedOrder || {}),

              orderStatus: 'Cancelled',

              cancellationReason:
                updatedOrder?.cancellationReason ||
                cancellationReason,

              cancelledAt:
                updatedOrder?.cancelledAt ||
                new Date().toISOString(),

              refundStatus:
                updatedOrder?.refundStatus ||
                (
                  order.paymentStatus === 'Paid'
                    ? 'Pending'
                    : 'Not Applicable'
                )

            };

          });


          this.isCancelling = false;

          this.closeCancelModal();

        },

        error: (error) => {

          console.error(
            'Cancellation failed:',
            error
          );

          this.isCancelling = false;

          alert(
            error?.error?.message ||
            'Unable to cancel this order. Please try again.'
          );

        }

      });

  }


  // ==========================================
  // ORDER HELPERS
  // ==========================================

  hasOrders(): boolean {

    return this.orders.length > 0;

  }


  // ==========================================
  // CAN CANCEL
  // ==========================================

  canCancel(order: Order): boolean {

    return (
      order.orderStatus !== 'Delivered' &&
      order.orderStatus !== 'Cancelled'
    );

  }


  // ==========================================
  // ORDER STATUS CLASS
  // ==========================================

  getStatusClass(status?: string): string {

    switch (status) {

      case 'Delivered':
        return 'delivered';

      case 'Processing':
        return 'processing';

      case 'Packed':
        return 'packed';

      case 'Shipped':
        return 'shipped';

      case 'Cancelled':
        return 'cancelled';

      default:
        return 'pending';

    }

  }


  // ==========================================
  // REFUND STATUS CLASS
  // ==========================================

getRefundClass(
  status:
    | 'Not Applicable'
    | 'Pending'
    | 'Processing'
    | 'Completed'
    | 'Refunded'
    | 'Failed'
    | null
    | undefined
): string {

  switch (status) {

    case 'Refunded':
    case 'Completed':
      return 'refunded';

    case 'Processing':
    case 'Pending':
      return 'processing';

    case 'Failed':
      return 'failed';

    case 'Not Applicable':
    case null:
    case undefined:
    default:
      return 'not-applicable';

  }

}


  // ==========================================
  // PAYMENT LABEL
  // ==========================================

  getPaymentLabel(order: Order): string {

    switch (order.paymentMethod) {

      case 'UPI':
        return 'UPI';

      case 'CARD':
        return 'Credit / Debit Card';

      case 'NETBANKING':
        return 'Net Banking';

      case 'WALLET':
        return 'Wallet';

      default:
        return order.paymentMethod || 'Online';

    }

  }


  // ==========================================
  // FORMAT DATE
  // ==========================================

  formatDate(date?: string | null): string {

    if (!date) {
      return '-';
    }

    return new Date(date).toLocaleDateString(
      'en-IN',
      {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }
    );

  }


  // ==========================================
  // FORMAT DATE + TIME
  // ==========================================

  formatDateTime(date?: string | null): string {

    if (!date) {
      return '-';
    }

    return new Date(date).toLocaleString(
      'en-IN',
      {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      }
    );

  }


  // ==========================================
  // TRACKING STEP COMPLETED
  // ==========================================

  isStepCompleted(
    order: Order,
    step: string
  ): boolean {

    const steps = [
      'Processing',
      'Packed',
      'Shipped',
      'Delivered'
    ];

    if (order.orderStatus === 'Cancelled') {
      return false;
    }

    return (
      steps.indexOf(order.orderStatus) >=
      steps.indexOf(step)
    );

  }


  // ==========================================
  // CURRENT TRACKING STEP
  // ==========================================

  isCurrent(
    order: Order,
    step: string
  ): boolean {

    return order.orderStatus === step;

  }

}