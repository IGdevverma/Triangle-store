import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../services/order';
import { Order } from '../../models/orders';
import { Router } from '@angular/router';
import { Payment } from '../../services/payment';




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
    FormsModule,

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
  isPlacingOrder = false;


  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    private router: Router,
    private orderService: OrderService,
    private paymentService: Payment
  ) {
    this.checkoutForm = this.fb.group({

      name: ['', Validators.required],

      phone: ['', [
        Validators.required,
        Validators.pattern('^[0-9]{10}$')
      ]],

      email: ['', [
        Validators.required,
        Validators.email
      ]],

      address: ['', Validators.required],

      city: ['', Validators.required],

      state: ['', Validators.required],

      pincode: ['', [
        Validators.required,
        Validators.pattern('^[0-9]{6}$')
      ]],

      paymentMethod: ['COD', Validators.required]

    });

  }

  ngOnInit(): void {
    this.cartItems = this.cartService.getCartItems();
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
    this.isPlacingOrder = true;
    this.paymentService.createOrder(this.grandTotal).subscribe({

      next: (response) => {

        console.log('Razorpay Order:', response);

      },

      error: (error) => {

        console.error(error);

      }

    });
    localStorage.setItem(
      'customerInfo',
      JSON.stringify(this.checkoutForm.value)
    );



    const order: Order = {

      customerName: this.checkoutForm.value.name,

      email: this.checkoutForm.value.email,

      phone: this.checkoutForm.value.phone,

      address: this.checkoutForm.value.address,

      city: this.checkoutForm.value.city,

      state: this.checkoutForm.value.state,

      pincode: this.checkoutForm.value.pincode,

      paymentMethod: this.checkoutForm.value.paymentMethod,

      paymentStatus: 'Pending',

      orderStatus: 'Processing',

      items: this.cartService.getCartItems(),

      total: this.grandTotal,

      date: new Date().toISOString()

    };

    this.orderService.addOrder(order).subscribe({

      next: (response) => {

        console.log("Response:", response);

        this.generatedOrderId = response.order._id;

        this.cartService.clearCart();

        this.orderPlaced = true;
        this.isPlacingOrder = false;
        localStorage.removeItem('customerInfo');
        this.checkoutForm.reset({

          paymentMethod: 'COD'

        });
        this.couponCode = '';

        this.discount = 0;

        this.discountAmount = 0;
        localStorage.removeItem('customerInfo');
        console.log("Popup State:", this.orderPlaced);

      },

      error: (error) => {
        this.isPlacingOrder = false;

        console.error(error);

        alert('Failed to place order.');

      }

    });


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
  continueShopping() {

    this.orderPlaced = false;

    this.router.navigate(['/']);

  }



}