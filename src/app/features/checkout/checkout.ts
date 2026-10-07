import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart';
import { OrderService } from '../../services/order';
import { Order } from '../../models/orders';
import { Router } from '@angular/router';
import { Payment } from '../../services/payment';
import { ChangeDetectorRef } from '@angular/core';
import { AuthService } from '../../services/auth';
import { CartItem } from '../../services/cart';


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

    FormsModule,

  ],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css'
})


export class Checkout implements OnInit {

  cartItems: CartItem[] = [];
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
  guestVerificationToken: string | null = null;

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
    private authService: AuthService,
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

      paymentMethod: ['UPI', Validators.required]

    });

  }




  ngOnInit(): void {

    // ==============================
    // CHECK BUY NOW FIRST
    // ==============================
    const buyNowItem =
      this.cartService.getBuyNowItem();

    const cartItems =
      this.cartService.getCartItems();

    if (buyNowItem) {

      // Direct Buy Now checkout
      this.isBuyNow = true;

      this.cartItems = [
        buyNowItem
      ];

    } else if (cartItems.length > 0) {

      // Normal cart checkout
      this.isBuyNow = false;

      this.cartItems = cartItems;

    } else {

      // Nothing to checkout
      this.isBuyNow = false;

      this.cartItems = [];

      this.router.navigate(['/']);

      return;

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

    // ---------------------------------------------
    // 1. Validate checkout details
    // ---------------------------------------------

    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    // ---------------------------------------------
    // 2. OTP verification is mandatory
    // ---------------------------------------------

    if (
      !this.otpVerified ||
      !this.guestVerificationToken
    ) {

      this.otpError =
        'Please verify your mobile number before continuing.';

      this.openPhoneVerification();

      return;
    }

    // ---------------------------------------------
    // 3. Server-side verification proof
    // ---------------------------------------------
    // Guest checkout must have a server-issued token.
    // Logged-in users are allowed to use their authenticated
    // session instead; the backend will handle that path.

    const isLoggedIn =
      this.authService.isLoggedIn();

    if (!isLoggedIn && !this.guestVerificationToken) {
      this.otpVerified = false;
      this.otpError =
        'Your mobile verification has expired. Please verify again.';
      this.openPhoneVerification();
      return;
    }

    // ---------------------------------------------
    // 4. Ensure the verified phone is unchanged
    // ---------------------------------------------

    const checkoutPhone =
      String(
        this.checkoutForm.get('phone')?.value || ''
      ).trim();

    if (
      checkoutPhone !== this.mobileForOtp
    ) {
      this.invalidatePhoneVerification();

      this.otpError =
        'Mobile number changed. Please verify it again.';
      this.openPhoneVerification();
      return;
    }

    // ---------------------------------------------
    // 5. Save checkout information
    // ---------------------------------------------

    localStorage.setItem(
      'customerInfo',
      JSON.stringify(this.checkoutForm.value)
    );

    // ---------------------------------------------
    // 6. Move to payment
    // ---------------------------------------------

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

    // Payment step se hi order place hoga.
    if (this.checkoutStep !== 'payment') {
      return;
    }

    // Prevent duplicate clicks / duplicate Razorpay orders.
    if (this.isPlacingOrder) {
      return;
    }

    // OTP verification is mandatory.
    if (
      !this.otpVerified ||
      !this.guestVerificationToken
    ) {

      this.otpError =
        'Please verify your mobile number before payment.';

      this.openPhoneVerification();

      return;
    }

    // For guests, frontend state alone is never trusted.
    // The guestVerificationToken must have been issued by our backend.
    const isLoggedIn =
      this.authService.isLoggedIn();

    if (!isLoggedIn && !this.guestVerificationToken) {
      this.otpVerified = false;
      this.otpError =
        'Your mobile verification has expired. Please verify again.';
      this.openPhoneVerification();
      return;
    }

    // Make sure the checkout phone is still the verified phone.
    const checkoutPhone =
      String(
        this.checkoutForm.get('phone')?.value || ''
      ).trim();

    if (
      !checkoutPhone ||
      checkoutPhone !== this.mobileForOtp
    ) {
      this.invalidatePhoneVerification();

      this.otpError =
        'Mobile number changed. Please verify it again.';
      this.openPhoneVerification();
      return;
    }

    this.isPlacingOrder = true;

    // Save latest customer information.
    localStorage.setItem(
      'customerInfo',
      JSON.stringify(this.checkoutForm.value)
    );

    const items =
      this.isBuyNow
        ? this.cartItems
        : this.cartService.getCartItems();

    const order: Order = {

      customerName:
        this.checkoutForm.value.name,

      email:
        this.checkoutForm.value.email,

      phone:
        checkoutPhone,

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

      items,

      total:
        this.grandTotal,

      couponCode:
        this.couponCode?.trim().toUpperCase() || '',

      date:
        new Date().toISOString()

    };

    // =============================================
    // COD ORDER
    // =============================================

    if (
      this.checkoutForm.value.paymentMethod === 'COD'
    ) {

      this.orderService
        .addOrder(
          order,
          this.guestVerificationToken
        )
        .subscribe({

          next: (res: any) => {

            console.log(
              'COD order created successfully:',
              res
            );

            this.generatedOrderId =
              res.order._id;

            // Clear cart
            if (this.isBuyNow) {
              this.cartService.clearBuyNow();
            } else {
              this.cartService.clearCart();
            }

            this.isPlacingOrder = false;

            localStorage.removeItem(
              'customerInfo'
            );

            this.couponCode = '';
            this.discount = 0;
            this.discountAmount = 0;

            // Go to success page
            this.router.navigate(
              ['/order-success'],
              {
                state: {
                  orderId: res.order.orderNumber,
                  order: res.order
                }
              }
            );

          },

          error: (err: any) => {

            console.error(
              'COD ORDER ERROR:',
              err
            );

            this.isPlacingOrder = false;

            alert(
              err?.error?.message ||
              'Unable to place COD order. Please try again.'
            );

          }

        });

      return;
    }



    // ---------------------------------------------
    // IMPORTANT
    // ---------------------------------------------
    // The Payment service/backend will be updated in the
    // next step to accept guestVerificationToken.
    // Do not trust this token on the client itself.
    // It must be sent to the backend and verified there.
    this.paymentService
      .createOrder(
        this.couponCode,
        items,
        this.guestVerificationToken
      )
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

          alert(
            error?.error?.message ||
            'Unable to start payment. Please try again.'
          );

        }

      });
  }


  get paymentMethod() {

    return this.checkoutForm.get('paymentMethod')?.value;
  }


  get subtotal(): number {

    if (this.isBuyNow) {

      const item = this.cartItems[0];

      if (!item) {
        return 0;
      }

      const price = Number(
        item.cartPrice ?? item.price ?? 0
      );

      return price * Number(item.quantity || 0);
    }

    return this.cartService.getTotal();
  }

  get shipping(): number {

    return this.subtotal >= 999 ? 0 : 99;

  }
  get taxableAmount(): number {
    return Math.max(
      this.subtotal - this.discountAmount,
      0
    );
  }

  get gst(): number {
    return 0;
  }

  get grandTotal(): number {
    return (
      this.taxableAmount +
      this.shipping
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
          .verifyPayment(
            paymentResponse,
            this.guestVerificationToken
          )
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
                .addOrder(
                  paidOrder,
                  this.guestVerificationToken
                )
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
                          orderId: res.order.orderNumber,
                          order: res.order
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


  sendCheckoutOTP(): void {

    this.otpError = '';
    this.otpSuccess = '';

    const phone =
      String(this.mobileForOtp || '').trim();

    if (!/^[0-9]{10}$/.test(phone)) {
      this.otpError =
        'Please enter a valid 10 digit mobile number';
      return;
    }

    // Any new OTP attempt invalidates the previous
    // server-side verification proof.
    this.invalidatePhoneVerification(false);

    const identifier = `91${phone}`;

    this.otpLoading = true;

    window.sendOtp(
      identifier,

      (data: any) => {

        console.log(
          'OTP sent successfully:',
          data
        );

        this.otpSent = true;
        this.otpLoading = false;

        this.otpSuccess =
          `OTP sent successfully to +91 ${phone}`;

        this.cdr.detectChanges();
      },

      (error: any) => {

        console.error(
          'OTP send error:',
          error
        );

        this.otpLoading = false;

        this.otpError =
          'Unable to send OTP. Please try again';

        this.cdr.detectChanges();
      }
    );
  }


  verifyCheckoutOTP(): void {

    this.otpError = '';
    this.otpSuccess = '';

    const otpValue =
      String(this.otp || '').trim();

    if (!/^[0-9]{4}$/.test(otpValue)) {
      this.otpError =
        'Please enter a valid 4 digit OTP';
      return;
    }

    const phone =
      String(this.mobileForOtp || '').trim();

    if (!/^\d{10}$/.test(phone)) {
      this.otpError =
        'Please enter a valid 10 digit mobile number';
      return;
    }

    if (this.otpLoading) {
      return;
    }

    this.otpLoading = true;

    window.verifyOtp(

      otpValue,

      (data: any) => {

        // Never log the MSG91 access token.
        console.log(
          'MSG91 OTP verification succeeded.'
        );

        // MSG91 widget returns its access token in `message`
        // in the integration currently used by this checkout.
        const msg91AccessToken =
          typeof data?.message === 'string'
            ? data.message
            : '';

        if (!msg91AccessToken) {

          console.error(
            'MSG91 access token was not returned.'
          );

          this.setOtpVerificationError(
            'OTP verification failed. Please try again.'
          );

          return;
        }

        // ---------------------------------------------
        // SERVER-SIDE PHONE VERIFICATION
        // ---------------------------------------------
        // The frontend does NOT decide that OTP is verified.
        // Our backend verifies the MSG91 token with MSG91 and,
        // for guests, returns a short-lived signed token.

        this.authService
          .verifyWidgetToken(
            msg91AccessToken,
            phone
          )
          .subscribe({

            next: (response: any) => {

              console.log(
                'Backend phone verification succeeded:',
                {
                  success: response?.success,
                  phone: response?.phone,
                  hasGuestVerificationToken:
                    !!response?.guestVerificationToken
                }
              );

              if (!response?.success) {

                this.setOtpVerificationError(
                  response?.message ||
                  'Phone verification failed. Please try again.'
                );

                return;
              }

              const isLoggedIn =
                this.authService.isLoggedIn();

              // Guest must receive a server-issued token.
              if (
                !isLoggedIn &&
                !response?.guestVerificationToken
              ) {

                console.error(
                  'Guest verification token missing from backend response.'
                );

                this.setOtpVerificationError(
                  'Phone verification could not be completed. Please try again.'
                );

                return;
              }

              // Store the server-issued proof only in memory.
              // Do not put it into localStorage.
              this.guestVerificationToken =
                response?.guestVerificationToken || null;

              this.mobileForOtp = phone;

              this.checkoutForm.patchValue({
                phone
              });

              this.otpVerified = true;
              this.otpLoading = false;
              this.otpSuccess =
                'Mobile number verified successfully';

              this.cdr.detectChanges();

              setTimeout(() => {

                this.showOtpModal = false;

                this.cdr.detectChanges();

              }, 800);
            },

            error: (error: any) => {

              console.error(
                'Backend phone verification failed:',
                error
              );

              this.setOtpVerificationError(
                error?.error?.message ||
                'Phone verification failed. Please try again.'
              );
            }

          });
      },

      (error: any) => {

        console.error(
          'MSG91 OTP verification failed:',
          error
        );

        this.setOtpVerificationError(
          'Invalid OTP. Please enter the correct OTP'
        );
      }
    );
  }


  /**
   * Clears all client-side OTP state.
   *
   * The server-issued guest token is intentionally kept
   * only in memory and is removed whenever the phone number
   * needs to be verified again.
   */
  private invalidatePhoneVerification(
    resetOtpInput = true
  ): void {

    this.otpVerified = false;
    this.guestVerificationToken = null;
    this.otpSent = false;

    if (resetOtpInput) {
      this.otp = '';
    }
  }


  private setOtpVerificationError(
    message: string
  ): void {

    this.otpLoading = false;
    this.otpVerified = false;
    this.guestVerificationToken = null;
    this.otpError = message;
    this.otpSuccess = '';

    this.cdr.detectChanges();
  }


  openPhoneVerification(): void {


    const phone =
      String(
        this.checkoutForm.get('phone')?.value || ''
      ).trim();

    if (!phone) {

      this.otpError =
        'Please enter mobile number';

      return;
    }

    if (!/^\d{10}$/.test(phone)) {

      this.otpError =
        'Please enter a valid 10 digit mobile number';

      return;
    }

    // Opening verification for a phone means the previous
    // verification proof must not remain valid on the client.
    this.mobileForOtp = phone;

    this.invalidatePhoneVerification();

    this.otpError = '';
    this.otpSuccess = '';
    this.showOtpModal = true;
  }

}
