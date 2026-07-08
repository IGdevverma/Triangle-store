import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OnInit } from '@angular/core';
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

  constructor(
    private orderService: OrderService,
    private cartService: CartService
  ) { }
  ngOnInit(): void {

    this.orderService.getOrders().subscribe({

      next: (response) => {

        this.orders = response.orders;
         

      },

      error: (error) => {

        console.error(error);

      }

    });

  }

  buyAgain(order: Order) {

    order.items.forEach(item => {

      this.cartService.addToCart(item);

    });

    alert('Products added to cart');

  }

  cancelOrder(orderId: string) {

    this.orderService
      .updateOrderStatus(orderId, 'Cancelled')
      .subscribe({

        next: () => {

          this.orders = this.orders.map(order => {

            if (order._id === orderId) {

              return {

                ...order,

                orderStatus: 'Cancelled'

              };

            }

            return order;

          });

        },

        error: (error) => {

          console.error(error);

        }

      });

  }


}