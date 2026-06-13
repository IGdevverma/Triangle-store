import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../services/order';





import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,

} from '@angular/forms';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    FormsModule
  ],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css'
})


export class Checkout implements OnInit {

  cartItems: any[] = [];
  checkoutForm: FormGroup;
  orderPlaced = false;
  generatedOrderId = '';
  couponCode = '';
  discount = 0;
  discountAmount = 0;


  constructor(private fb: FormBuilder,
    private cartService: CartService,
    private orderService: OrderService) {

    this.checkoutForm = this.fb.group({

      name: ['', Validators.required],
      phone: [

        '',

        [

          Validators.required,

          Validators.pattern('^[0-9]{10}$')

        ]

      ],

      email: ['', [Validators.required, Validators.email]],

      address: ['', Validators.required],

      paymentMethod: ['COD', Validators.required]

    });

  }

  ngOnInit(): void {

    const savedData =
      localStorage.getItem('customerInfo');

    if (savedData) {

      this.checkoutForm.patchValue(
        JSON.parse(savedData)
      );

    }

  }

  placeOrder() {

    if (this.checkoutForm.invalid) {

      this.checkoutForm.markAllAsTouched();

      return;

    }
    localStorage.setItem(
      'customerInfo',
      JSON.stringify(this.checkoutForm.value)
    );

    const orderId = 'TS' + Date.now();

    this.orderService.addOrder({

      id: orderId,
      items: this.cartService.getCartItems(),
      total: this.grandTotal,
      date: new Date().toLocaleDateString(),
      status: 'Processing'

    });
    this.generatedOrderId = orderId;
    this.cartService.clearCart();

    this.orderPlaced = true;

  }
  get paymentMethod() {

    return this.checkoutForm.get('paymentMethod')?.value;
  }


  get subtotal(): number {

    return this.cartService.getTotal();

  }

  get shipping(): number {

    return this.subtotal >= 1999 ? 0 : 99;

  }

  get gst(): number {

    return Math.round(this.subtotal * 0.18);

  }

  get grandTotal(): number {

    return (

      this.subtotal +

      this.shipping +

      this.gst -

      this.discountAmount

    );

  }
  applyCoupon() {

    const code = this.couponCode.trim().toUpperCase();

    if (code === 'SAVE10') {

      this.discount = 10;

    }

    else if (code === 'WELCOME20') {

      this.discount = 20;

    }

    else {

      this.discount = 0;

      alert('Invalid Coupon Code');

    }

    this.discountAmount = Math.round(
      (this.subtotal * this.discount) / 100
    );

  }



}