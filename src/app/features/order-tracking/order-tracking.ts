import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

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
formatDate(arg0: any) {
throw new Error('Method not implemented.');
}

  steps = [
    'Processing',
    'Packed',
    'Shipped',
    'Delivered'
  ];

  order: any;

  constructor(

    private route: ActivatedRoute,

    private orderService: OrderService

  ) { }

  ngOnInit(): void {

    const id = this.route.snapshot.paramMap.get('id');

    if (id) {

      this.orderService.getOrderById(id).subscribe({

        next: (response: any) => {

          this.order = response.order;

          console.log(this.order);

        },

        error: (err) => {

          console.error(err);

        }

      });

    }

  }

  isCompleted(step: string): boolean {

    if (!this.order) return false;

    const currentIndex = this.steps.indexOf(this.order.orderStatus);

    const stepIndex = this.steps.indexOf(step);

    return stepIndex <= currentIndex;

  }

  isCurrent(step: string): boolean {

    if (!this.order) return false;

    return this.order.orderStatus === step;

  }

}
