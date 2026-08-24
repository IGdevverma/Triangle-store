import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../services/order';
import { Order } from '../../models/orders';
import { Router } from '@angular/router';
import { Payment } from '../../services/payment';
import { ChangeDetectorRef } from '@angular/core';


declare global {
  interface Window {

    sendOtp: (
      identifier: string,
      success?: (data: any) => void,
      failure?: (error: any) => void
    ) => void;

    verifyOtp: (
      otp: string | number,
      success?: (data: any) => void,
      failure?: (error: any) => void,
      reqId?: string
    ) => void;

    retryOtp: (
      channel: string | null,
      success?: (data: any) => void,
      failure?: (error: any) => void,
      reqId?: string
    ) => void;

  }
}


declare var Razorpay: any;

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
  checkoutStep: 'details' | 'payment' = 'details';
  checkoutForm: FormGroup;
  orderPlaced = false;
  generatedOrderId = '';
  couponCode = '';
  discount = 0;
  discountAmount = 0;
  isPlacingOrder = false;

  mobileForOtp = '';
  otp = '';

  otpSent = false;
  otpVerified = false;

  otpLoading = false;

  otpError = '';
  otpSuccess = '';

  showOtpModal = false;

  get totalItems(): number {

    return this.cartItems.reduce(
      (total, item) => total + (item.quantity || 0),
      0
    );

  }


  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    private router: Router,
    private orderService: OrderService,
    private paymentService: Payment,
    private cdr: ChangeDetectorRef

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

      paymentMethod: ['ONLINE', Validators.required]

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
  continueToPayment(): void {

    // 1. Validate delivery details
    if (this.checkoutForm.invalid) {

      this.checkoutForm.markAllAsTouched();

      return;
    }

    // 2. Phone OTP verification
    if (!this.otpVerified) {

      this.otpError =
        'Please verify your mobile number before continuing.';

      this.openPhoneVerification();

      return;
    }

    // 3. Ensure verified number is same as checkout number
    const checkoutPhone =
      this.checkoutForm.get('phone')?.value;

    if (this.mobileForOtp !== checkoutPhone) {

      this.otpVerified = false;

      this.otpError =
        'Mobile number changed. Please verify it again.';

      this.openPhoneVerification();

      return;
    }

    // 4. Save delivery information
    localStorage.setItem(
      'customerInfo',
      JSON.stringify(this.checkoutForm.value)
    );

    // 5. Move to payment step
    this.checkoutStep = 'payment';

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  backToDetails(): void {

    this.checkoutStep = 'details';

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

  }





  placeOrder(): void {

    // Payment step se hi order place hoga
    if (this.checkoutStep !== 'payment') {
      return;
    }

    // Prevent double click
    if (this.isPlacingOrder) {
      return;
    }

    // OTP safety check
    if (!this.otpVerified) {

      this.otpError =
        'Please verify your mobile number first.';

      this.openPhoneVerification();

      return;
    }

    this.isPlacingOrder = true;

    // Save latest customer information
    localStorage.setItem(
      'customerInfo',
      JSON.stringify(this.checkoutForm.value)
    );

    const order: Order = {

      customerName:
        this.checkoutForm.value.name,

      email:
        this.checkoutForm.value.email,

      phone:
        this.checkoutForm.value.phone,

      address:
        this.checkoutForm.value.address,

      city:
        this.checkoutForm.value.city,

      state:
        this.checkoutForm.value.state,

      pincode:
        this.checkoutForm.value.pincode,

      paymentMethod:
        this.checkoutForm.value.paymentMethod,

      paymentStatus:
        'Pending',

      orderStatus:
        'Processing',

      items:
        this.cartService.getCartItems(),

      total:
        this.grandTotal,

      date:
        new Date().toISOString()

    };

    // Create Razorpay order
    this.paymentService
      .createOrder(this.grandTotal)
      .subscribe({

        next: (response) => {

          this.openRazorpay(
            response,
            order
          );

        },

        error: (error) => {

          console.error(
            'Razorpay order creation failed:',
            error
          );

          this.isPlacingOrder = false;

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
  openRazorpay(response: any, order: Order) {

    const options = {

      key: response.key,

      amount: response.order.amount,

      currency: response.order.currency,

      name: "Triangle Sports",

      description: "Order Payment",

      order_id: response.order.id,
      notes: {

        customerName: this.checkoutForm.value.name

      },


      handler: (paymentResponse: any) => {



        this.paymentService.verifyPayment(paymentResponse).subscribe({

          next: (verifyRes) => {

            order.paymentStatus = "Paid";
            order.razorpayOrderId = paymentResponse.razorpay_order_id;
            order.razorpayPaymentId = paymentResponse.razorpay_payment_id;
            order.paymentVerifiedAt = new Date().toISOString();

            this.orderService.addOrder(order).subscribe({

              next: (res) => {

                // 1. Save generated order ID
                this.generatedOrderId = res.order._id;

                // 2. Clear cart after order is successfully saved
                this.cartService.clearCart();

                // 3. Stop loading
                this.isPlacingOrder = false;

                // 4. Clear saved checkout information
                localStorage.removeItem('customerInfo');

                // 5. Reset coupon
                this.couponCode = '';
                this.discount = 0;
                this.discountAmount = 0;

                // 6. Redirect to Order Success page
                this.router.navigate(['/order-success'], {
                  state: {
                    orderId: res.order._id
                  }
                });

              },

              error: (err) => {

                alert(err.error.message);

                this.isPlacingOrder = false;

              }

            });

          },

          error: (err) => {


            alert("Payment verification failed.");
            order.paymentStatus = "Failed";
            this.isPlacingOrder = false;

          }

        });

      },

      prefill: {

        name: this.checkoutForm.value.name,

        email: this.checkoutForm.value.email,

        contact: this.checkoutForm.value.phone

      },
      modal: {

        ondismiss: () => {

          this.isPlacingOrder = false;

        }

      },

      theme: {

        color: "#ff4d5a"

      }

    };

    const razorpay = new Razorpay(options);

    razorpay.open();

  }


  continueShopping() {

    this.orderPlaced = false;

    this.router.navigate(['/']);

  }


  sendCheckoutOTP() {

    this.otpError = '';
    this.otpSuccess = '';

    const phone = this.mobileForOtp.trim();

    if (!/^[0-9]{10}$/.test(phone)) {
      this.otpError = 'Please enter a valid 10 digit mobile number';
      return;
    }

    const identifier = '91' + phone;

    this.otpLoading = true;

    window.sendOtp(
      identifier,

      (data: any) => {

        console.log('OTP sent successfully:', data);

        this.otpSent = true;
        this.otpLoading = false;

        this.otpSuccess =
          'OTP sent successfully to +91 ' + phone;

        // IMPORTANT
        this.cdr.detectChanges();

      },

      (error: any) => {

        console.error('OTP send error:', error);

        this.otpLoading = false;

        this.otpError =
          'Unable to send OTP. Please try again';

        // IMPORTANT
        this.cdr.detectChanges();

      }
    );
  }


  verifyCheckoutOTP() {

    this.otpError = '';
    this.otpSuccess = '';

    if (!this.otp) {

      this.otpError = 'Please enter OTP';

      return;
    }

    this.otpLoading = true;

    window.verifyOtp(

      this.otp,

      (data: any) => {

        console.log('OTP VERIFIED:', data);

        this.otpLoading = false;
        this.otpVerified = true;

        this.otpSuccess =
          'Mobile number verified successfully';

        this.checkoutForm.patchValue({
          phone: this.mobileForOtp
        });

        this.cdr.detectChanges();

        setTimeout(() => {

          this.showOtpModal = false;

          this.cdr.detectChanges();

        }, 800);

      },

      (error: any) => {

        console.error(
          'OTP verification failed:',
          error
        );

        this.otpLoading = false;

        this.otpError =
          'Invalid OTP. Please enter the correct OTP';

        this.cdr.detectChanges();

      }
    );
  }


  openPhoneVerification() {

    const phone = this.checkoutForm.get('phone')?.value;

    if (!phone) {

      this.otpError = 'Please enter mobile number';

      return;

    }

    if (!/^[0-9]{10}$/.test(phone)) {

      this.otpError =
        'Please enter a valid 10 digit mobile number';

      return;

    }

    this.mobileForOtp = phone;

    this.otp = '';

    this.otpSent = false;

    this.otpVerified = false;

    this.otpError = '';

    this.otpSuccess = '';

    this.showOtpModal = true;

  }

}
