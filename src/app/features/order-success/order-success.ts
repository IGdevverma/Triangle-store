import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-order-success',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './order-success.html',
  styleUrl: './order-success.css'
})
export class OrderSuccess {

  orderId: string = '';
  deliveryDate: string = '';

  // Copy Button State
  copied: boolean = false;

  constructor() {

    const navigation = history.state;

    this.orderId = navigation.orderId || 'N/A';

    const date = new Date();

    date.setDate(date.getDate() + 5);

    this.deliveryDate = date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

  }

  copyOrderId() {

    navigator.clipboard.writeText(this.orderId);

    this.copied = true;

    setTimeout(() => {

      this.copied = false;

    }, 2000);

  }

}