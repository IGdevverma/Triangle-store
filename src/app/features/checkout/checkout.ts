import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../services/order';



import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css'
})
export class Checkout {

  checkoutForm: FormGroup;

  orderPlaced = false;

  constructor(private fb: FormBuilder,
    private cartService: CartService,
    private orderService: OrderService) {

    this.checkoutForm = this.fb.group({

      name: ['', Validators.required],

      email: ['', [Validators.required, Validators.email]],

      address: ['', Validators.required],

      paymentMethod: ['COD', Validators.required]

    });

  }

  placeOrder() {

    if (this.checkoutForm.valid) {

      this.orderService.addOrder({

        id: Date.now(),

        items: this.cartService.getCartItems(),

        total: this.cartService.getTotal(),

        date: new Date().toLocaleDateString()

      });

      this.cartService.clearCart();

      this.orderPlaced = true;

    }

  }
  get paymentMethod() {

    return this.checkoutForm.get('paymentMethod')?.value;
  }

}