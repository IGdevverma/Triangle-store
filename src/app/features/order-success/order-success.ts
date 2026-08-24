import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

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

    this.orderId =
      navigationState?.orderId ||
      'N/A';

    this.deliveryDate =
      this.calculateDeliveryDate();

  }


  // =========================================
  // DELIVERY DATE
  // =========================================

  private calculateDeliveryDate(): string {

    const date = new Date();

    // Estimated delivery = 5 days
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

}