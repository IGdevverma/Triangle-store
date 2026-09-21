import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

interface OrderItem {
  productId?: string;
  name: string;
  image?: string;
  price: number;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  selectedPack?: string;
  selectedCombination?: string;
  packQuantity?: number;
  totalUnits?: number;
}

interface OrderData {
  orderNumber?: string;

  customerName?: string;
  email?: string;
  phone?: string;

  address?: string;
  city?: string;
  state?: string;
  pincode?: string;

  paymentMethod?: string;
  paymentStatus?: string;

  items?: OrderItem[];

  subtotal?: number;
  discountAmount?: number;
  shipping?: number;
  gst?: number;
  total?: number;

  couponCode?: string;

  orderStatus?: string;
}

@Component({
  selector: 'app-order-success',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './order-success.html',
  styleUrl: './order-success.css'
})
export class OrderSuccess implements OnInit {

  // =========================================
  // ORDER DATA
  // =========================================

  orderId = '';

  deliveryDate = '';

  order: OrderData | null = null;


  // =========================================
  // UI STATE
  // =========================================

  copied = false;


  // =========================================
  // INITIALIZATION
  // =========================================

  ngOnInit(): void {

    this.loadOrderDetails();

  }


  // =========================================
  // LOAD ORDER DETAILS
  // =========================================

  private loadOrderDetails(): void {

    const navigationState = history.state;

    this.order =
      navigationState?.order || null;

    this.orderId =
      navigationState?.orderId ||
      this.order?.orderNumber ||
      'N/A';

    this.deliveryDate =
      this.calculateDeliveryDate();

  }


  // =========================================
  // DELIVERY DATE
  // =========================================

  private calculateDeliveryDate(): string {

    const date = new Date();

    date.setDate(
      date.getDate() + 5
    );

    return date.toLocaleDateString(
      'en-IN',
      {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }
    );

  }


  // =========================================
  // COPY ORDER ID
  // =========================================

  copyOrderId(): void {

    if (
      !this.orderId ||
      this.orderId === 'N/A'
    ) {

      return;

    }

    navigator.clipboard
      .writeText(this.orderId)
      .then(() => {

        this.copied = true;

        setTimeout(() => {

          this.copied = false;

        }, 2000);

      })
      .catch((error) => {

        console.error(
          'Unable to copy order ID:',
          error
        );

      });

  }


  // =========================================
  // PRICE FORMAT
  // =========================================

  formatPrice(value: number | undefined): string {

    return `₹${(value || 0).toLocaleString('en-IN')}`;

  }

}