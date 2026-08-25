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
  isBuyNow = false;
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

    // ==============================
    // CHECK BUY NOW FIRST
    // ==============================

    const buyNowItem =
      this.cartService.getBuyNowItem();

    if (buyNowItem) {

      this.isBuyNow = true;

      this.cartItems = [
        buyNowItem
      ];

    } else {

      this.isBuyNow = false;

      this.cartItems =
        this.cartService.getCartItems();

    }


    // ==============================
    // LOAD CUSTOMER INFORMATION
    // ==============================

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
        this.isBuyNow
          ? this.cartItems
          : this.cartService.getCartItems(),

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

    if (this.isBuyNow) {

      const item =
        this.cartItems[0];

      if (!item) {
        return 0;
      }

      return Number(item.price) *
        Number(item.quantity);

    }

    return this.cartService.getTotal();

  }

  get shipping(): number {

    return this.subtotal >= 1999 ? 0 : 99;

  }

  get taxableAmount(): number {
    return Math.max(
      this.subtotal - this.discountAmount,
      0
    );
  }

  get gst(): number {

    return Math.round(this.subtotal * 0.05);

  }

  get grandTotal(): number {
    return (
      this.taxableAmount +
      this.shipping +
      this.gst
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
  openRazorpay(response: any, order: Order): void {

    const options = {

      // ==========================================
      // RAZORPAY CONFIG
      // ==========================================

      key: response.key,

      amount: response.order.amount,

      currency: response.order.currency,

      name: 'Triangle Sports',

      description: 'Order Payment',

      order_id: response.order.id,

      // ==========================================
      // CUSTOMER DETAILS
      // ==========================================

      prefill: {

        name:
          this.checkoutForm.value.name,

        email:
          this.checkoutForm.value.email,

        contact:
          this.checkoutForm.value.phone

      },

      // ==========================================
      // NOTES
      // ==========================================

      notes: {

        customerName:
          this.checkoutForm.value.name

      },

      // ==========================================
      // PAYMENT SUCCESS
      // ==========================================

      handler: (paymentResponse: any) => {

        console.log(
          'Razorpay payment response:',
          paymentResponse
        );

        // ----------------------------------------
        // Verify payment from BACKEND
        // ----------------------------------------

        this.paymentService
          .verifyPayment(paymentResponse)
          .subscribe({

            // ====================================
            // PAYMENT VERIFIED
            // ====================================

            next: (verifyRes: any) => {

              console.log(
                'Payment verification response:',
                verifyRes
              );

              // ----------------------------------
              // Backend verification failed
              // ----------------------------------

              if (!verifyRes?.success) {

                alert(
                  verifyRes?.message ||
                  'Payment verification failed.'
                );

                this.isPlacingOrder = false;

                return;
              }

              // ----------------------------------
              // Payment is verified
              // ----------------------------------

              const paidOrder: Order = {

                ...order,

                razorpayOrderId:
                  verifyRes.razorpayOrderId,

                razorpayPaymentId:
                  verifyRes.razorpayPaymentId,

                paymentStatus:
                  'Paid',

                paymentVerifiedAt:
                  new Date().toISOString()

              };

              // ==================================
              // CREATE ORDER IN DATABASE
              // ==================================

              this.orderService
                .addOrder(paidOrder)
                .subscribe({

                  // ==============================
                  // ORDER CREATED
                  // ==============================

                  next: (res: any) => {

                    console.log(
                      'Order created successfully:',
                      res
                    );

                    // Save generated order ID
                    this.generatedOrderId =
                      res.order._id;

                    // Clear cart
                    if (this.isBuyNow) {

                      this.cartService.clearBuyNow();

                    } else {

                      this.cartService.clearCart();

                    }

                    // Stop loading
                    this.isPlacingOrder = false;

                    // Clear checkout information
                    localStorage.removeItem(
                      'customerInfo'
                    );

                    // Reset coupon
                    this.couponCode = '';

                    this.discount = 0;

                    this.discountAmount = 0;

                    // =================================
                    // REDIRECT TO SUCCESS PAGE
                    // =================================

                    this.router.navigate(
                      ['/order-success'],
                      {
                        state: {
                          orderId:
                            res.order._id
                        }
                      }
                    );

                  },

                  // ==============================
                  // ORDER CREATION FAILED
                  // ==============================

                  error: (err: any) => {

                    console.error(
                      'ORDER CREATION ERROR:',
                      err
                    );

                    alert(
                      err?.error?.message ||
                      'Payment succeeded but order creation failed. Please contact support.'
                    );

                    this.isPlacingOrder = false;

                  }

                });

            },

            // ====================================
            // PAYMENT VERIFICATION ERROR
            // ====================================

            error: (err: any) => {

              console.error(
                'PAYMENT VERIFICATION ERROR:',
                err
              );

              alert(
                err?.error?.message ||
                'Payment verification failed.'
              );

              this.isPlacingOrder = false;

            }

          });

      },

      // ==========================================
      // RAZORPAY MODAL CLOSED
      // ==========================================

      modal: {

        ondismiss: () => {

          console.log(
            'Razorpay payment window closed'
          );

          this.isPlacingOrder = false;

        }

      },

      // ==========================================
      // RAZORPAY THEME
      // ==========================================

      theme: {

        color: '#ff4d5a'

      }

    };

    // ============================================
    // OPEN RAZORPAY
    // ============================================

    const razorpay =
      new Razorpay(options);

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
