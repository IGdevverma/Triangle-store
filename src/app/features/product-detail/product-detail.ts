import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LoadingService } from '../../services/loading';
import { CartService } from '../../services/cart';
import { ProductService } from '../../services/product';
import { NotificationService } from '../../services/notification';
import { SeoService } from '../../services/seo';
import { OtpService } from '../../services/otp.service';
import { Product } from '../../models/product';
import { Router } from '@angular/router';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css'
})
export class ProductDetail implements OnInit {

  product?: Product;

  zoomTransform = 'scale(1)';
  zoomOrigin = 'center center';

  selectedSize = 'M';
  quantity = 1;
  selectedColor: string = '';
  selectedImage = '';

  relatedProducts: Product[] = [];

  sizes = ['S', 'M', 'L', 'XL'];

  productImages: string[] = [];

  activeTab: 'description' | 'reviews' = 'description';

  reviews: any[] = [];

  newReview = {
    name: '',
    rating: 5,
    comment: ''
  };

  pincode = '';
  deliveryMessage = '';
  deliveryCharge = 99;
  isPincodeSaved = false;

  // ================= BUY NOW MODAL =================

  showBuyNowModal = false;

  buyNowStep: 'mobile' | 'otp' | 'address' = 'mobile';

  mobileNumber = '';

  mobileError = '';
  isSendingOtp = false;
  isVerifyingOtp = false;

  resendDisabled = false;
  resendTimer = 0;
  couponCode = '';

  couponMessage = '';

  otp = '';

  otpError = '';

  otpSent = false;


  // ================= ADDRESS =================

  address = {
    pincode: '',
    firstName: '',
    lastName: '',
    flat: '',
    area: '',
    landmark: '',
    city: '',
    state: '',
    email: '',
    addressType: 'Home'
  };

  addressError = '';
  showSizeGuide: any;



  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private router: Router,
    private cartService: CartService,
    private notificationService: NotificationService,
    private loadingService: LoadingService,
    private http: HttpClient,
    private otpService: OtpService,

    private seoService: SeoService
  ) { }


  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      console.error('Product ID not found');
      return;
    }

    this.loadingService.show();


    // =====================================================
    // GET PRODUCT
    // =====================================================

    this.productService.getProductById(id).subscribe({

      next: (response: any) => {

        const data: Product = response.product;
        console.log('PRODUCT FROM API:', data);
        console.log('PRODUCT SIZES:', data.sizes);
        console.log('PRODUCT COLORS:', data.colors);

        if (!data) {

          console.error('Product not found');

          this.loadingService.hide();

          return;
        }


        // -----------------------------------------------
        // SET PRODUCT
        // -----------------------------------------------

        this.product = data;


        // -----------------------------------------------
        // PRODUCT IMAGES
        // -----------------------------------------------

        this.productImages =
          data.images?.length
            ? data.images
            : data.image
              ? [data.image]
              : [];


        this.selectedImage =
          this.productImages.length
            ? this.productImages[0]
            : '';


        // -----------------------------------------------
        // REVIEWS
        // -----------------------------------------------

        const savedReviews = localStorage.getItem(
          `reviews_${data._id}`
        );

        if (savedReviews) {

          try {

            this.reviews = JSON.parse(savedReviews);

          } catch (error) {

            console.error(
              'Error parsing reviews:',
              error
            );

            this.reviews = [];

          }

        }


        // -----------------------------------------------
        // SEO
        // IMPORTANT:
        // Use data instead of this.product
        // -----------------------------------------------

        this.seoService.updateSeo(

          `${data.name} | Triangle Sports`,

          data.description ||
          'Premium sportswear by Triangle Sports.',

          `
          ${data.category || ''},
          ${data.brand || ''},
          ${data.type || ''},
          Sportswear,
          Gym Wear
          `

        );


        // -----------------------------------------------
        // RELATED PRODUCTS
        // -----------------------------------------------

        this.productService.getProducts().subscribe({

          next: (res: any) => {

            const products: Product[] =
              res.products || [];


            this.relatedProducts = products

              .filter((p: Product) =>
                p.category === data.category &&
                p._id !== data._id
              )

              .slice(0, 4);


            this.loadingService.hide();

          },

          error: (error) => {

            console.error(
              'Error loading related products:',
              error
            );

            this.relatedProducts = [];

            this.loadingService.hide();

          }

        });

      },


      error: (err) => {

        console.error(
          'Error loading product:',
          err
        );

        this.loadingService.hide();

      }

    });


    // =====================================================
    // PINCODE
    // =====================================================

    const savedPincode =
      localStorage.getItem('deliveryPincode');


    if (savedPincode) {

      this.pincode = savedPincode;

      this.isPincodeSaved = true;

      this.checkDelivery();

    }

  }


  // =====================================================
  // QUANTITY
  // =====================================================

  increaseQuantity(): void {

    if (!this.product) {
      return;
    }


    if (this.quantity < this.product.stock) {

      this.quantity++;

    } else {

      alert(
        `Only ${this.product.stock} items available`
      );

    }

  }


  decreaseQuantity(): void {

    if (this.quantity > 1) {

      this.quantity--;

    }

  }


  // =====================================================
  // ADD TO CART
  // =====================================================

  addToCart(): void {

    if (!this.product) {
      return;
    }


    if (this.product.stock === 0) {

      alert('This product is Out of Stock');

      return;

    }


    if (this.quantity > this.product.stock) {

      alert(
        `Only ${this.product.stock} items available`
      );

      return;

    }


    this.cartService.addToCart({

      ...this.product,

      quantity: this.quantity,

      selectedSize: this.selectedSize

    });


    this.notificationService.show(

      `${this.product.name} added to cart`

    );

  }

  onMobileInput(): void {

    this.mobileNumber = this.mobileNumber
      .replace(/\D/g, '')
      .slice(0, 10);

    this.mobileError = '';
  }


  // =====================================================
  // BUY NOW
  // =====================================================
  buyNow(): void {

    if (!this.product) {
      return;
    }

    if (this.product.stock === 0) {
      alert('This product is Out of Stock');
      return;
    }

    if (this.quantity > this.product.stock) {
      alert(`Only ${this.product.stock} items available`);
      return;
    }

    // Add product to cart
    this.cartService.addToCart(this.product);

    // Directly go to checkout
    this.router.navigate(['/checkout']);
  }

  // =====================================================
  // REVIEWS
  // =====================================================

  submitReview(): void {

    if (
      !this.newReview.name.trim() ||
      !this.newReview.comment.trim()
    ) {

      alert(
        'Please enter your name and review'
      );

      return;

    }


    if (!this.product) {
      return;
    }


    const review = {

      name: this.newReview.name.trim(),

      rating: this.newReview.rating,

      comment: this.newReview.comment.trim(),

      date: new Date()

    };


    this.reviews.push(review);


    localStorage.setItem(

      `reviews_${this.product._id}`,

      JSON.stringify(this.reviews)

    );


    this.newReview = {

      name: '',

      rating: 5,

      comment: ''

    };

  }


  // =====================================================
  // AVERAGE RATING
  // =====================================================

  get averageRating(): number {

    if (!this.reviews.length) {

      return 0;

    }


    const total = this.reviews.reduce(

      (sum, review) =>
        sum + Number(review.rating),

      0

    );


    return total / this.reviews.length;

  }


  get roundedRating(): number {

    return Math.round(
      this.averageRating
    );

  }

  selectImage(image: string): void {
    this.selectedImage = image;

    // Reset zoom when image changes
    this.zoomTransform = 'scale(1)';
    this.zoomOrigin = 'center center';
  }

  // =====================================================
  // IMAGE ZOOM
  // =====================================================

  onMouseMove(event: MouseEvent): void {

    const container =
      event.currentTarget as HTMLElement;


    if (!container) {
      return;
    }


    const rect =
      container.getBoundingClientRect();


    const x =
      ((event.clientX - rect.left) /
        rect.width) * 100;


    const y =
      ((event.clientY - rect.top) /
        rect.height) * 100;


    this.zoomOrigin =
      `${x}% ${y}%`;


    this.zoomTransform =
      'scale(2)';

  }


  resetZoom(): void {

    this.zoomTransform =
      'scale(1)';

    this.zoomOrigin =
      'center center';

  }


  // =====================================================
  // DELIVERY
  // =====================================================

  checkDelivery(): void {

    if (
      !this.pincode ||
      !/^\d{6}$/.test(this.pincode)
    ) {

      this.deliveryMessage =
        'Enter a valid 6-digit Pincode';

      this.isPincodeSaved = false;

      return;

    }


    localStorage.setItem(
      'deliveryPincode',
      this.pincode
    );


    this.isPincodeSaved = true;


    const today = new Date();

    const deliveryDate =
      new Date(today);


    // Delhi / NCR / Ghaziabad
    if (
      this.pincode.startsWith('201') ||
      this.pincode.startsWith('110')
    ) {

      deliveryDate.setDate(
        today.getDate() + 2
      );

      this.deliveryCharge = 0;

    } else {

      deliveryDate.setDate(
        today.getDate() + 5
      );

      this.deliveryCharge = 99;

    }


    this.deliveryMessage =
      `Get it by ${deliveryDate.toLocaleDateString(
        'en-IN',
        {
          weekday: 'long',
          day: 'numeric',
          month: 'long'
        }
      )}`;

  }


  changePincode(): void {

    localStorage.removeItem(
      'deliveryPincode'
    );


    this.pincode = '';

    this.deliveryMessage = '';

    this.deliveryCharge = 99;

    this.isPincodeSaved = false;

  }


  closeBuyNowModal(): void {

    this.showBuyNowModal = false;

    this.buyNowStep = 'mobile';

    this.mobileNumber = '';

    this.mobileError = '';

    this.otp = '';

    this.otpError = '';

    this.otpSent = false;

    this.couponCode = '';

    this.couponMessage = '';

    this.addressError = '';

  }


  validateMobile(): boolean {

    const mobile = this.mobileNumber.trim();

    if (!mobile) {

      this.mobileError = 'Please enter your mobile number';

      return false;

    }

    if (!/^[6-9]\d{9}$/.test(mobile)) {

      this.mobileError = 'Please enter a valid 10-digit mobile number';

      return false;

    }

    this.mobileError = '';

    return true;
  }

  applyCoupon(): void {

    if (!this.couponCode.trim()) {

      this.couponMessage = 'Please enter a coupon code';

      return;

    }

    if (this.couponCode.trim().toUpperCase() === 'TRIANGLE10') {

      this.couponMessage = 'Coupon applied successfully';

    } else {

      this.couponMessage = 'Invalid coupon code';

    }
  }



  validateAddress(): boolean {

    const a = this.address;

    if (!/^\d{6}$/.test(a.pincode)) {

      this.addressError =
        'Please enter a valid 6-digit pincode';

      return false;
    }

    if (!a.firstName.trim()) {

      this.addressError =
        'Please enter first name';

      return false;
    }

    if (!a.lastName.trim()) {

      this.addressError =
        'Please enter last name';

      return false;
    }

    if (!a.flat.trim()) {

      this.addressError =
        'Please enter flat / house number';

      return false;
    }

    if (!a.area.trim()) {

      this.addressError =
        'Please enter area / street';

      return false;
    }

    if (!a.city.trim()) {

      this.addressError =
        'Please enter city';

      return false;
    }

    if (!a.state.trim()) {

      this.addressError =
        'Please enter state';

      return false;
    }

    this.addressError = '';

    return true;
  }


  addAddress(): void {

    if (!this.validateAddress()) {
      return;
    }

    localStorage.setItem(
      'checkoutAddress',
      JSON.stringify(this.address)
    );

    // Yahan next step payment/order hoga
    console.log('Address saved:', this.address);

  }

  sendOtp(): void {

    this.mobileError = '';

    this.http.post<any>(
      'http://localhost:8000/api/auth/send-otp',
      {
        mobile: this.mobileNumber
      }
    ).subscribe({

      next: (response) => {

        if (response.success) {

          this.otpSent = true;

          console.log('OTP sent successfully');

        }

      },

      error: (error) => {

        console.error('OTP Error:', error);

        this.mobileError =
          error.error?.message ||
          'Unable to send OTP. Please try again.';

      }

    });
  }

  verifyOtp(): void {

    this.otpError = '';

    if (this.otp.length !== 6) {

      this.otpError = 'Please enter a valid 6-digit OTP';

      return;
    }

    this.http.post<any>(
      'http://localhost:8000/api/auth/verify-otp',
      {
        mobile: this.mobileNumber,
        otp: this.otp
      }
    ).subscribe({

      next: (response) => {

        if (response.success && response.verified) {

          this.showBuyNowModal = false;

          this.router.navigate(['/checkout']);

        }

      },

      error: (error) => {

        console.error('OTP verification failed:', error);

        this.otpError =
          error.error?.message ||
          'Invalid OTP. Please try again.';

      }

    });
  }


  onOtpInput(): void {
    this.otp = this.otp
      .replace(/\D/g, '')
      .slice(0, 6);

    this.otpError = '';
  }

  continueToCheckout(): void {

    this.mobileError = '';

    const mobile = this.mobileNumber.replace(/\D/g, '');

    if (!mobile) {
      this.mobileError = 'Please enter your mobile number';
      return;
    }

    if (mobile.length !== 10) {
      this.mobileError = 'Please enter a valid 10-digit mobile number';
      return;
    }

    this.mobileNumber = mobile;

    console.log('Mobile number:', this.mobileNumber);

    // OTP API yahan call hogi
    console.log('Sending OTP to:', this.mobileNumber);
  }


  resendOtp(): void {

    if (!this.mobileNumber) {
      this.mobileError = 'Mobile number is missing.';
      return;
    }

    this.otpError = '';
    this.isSendingOtp = true;

    this.otpService.sendOtp(this.mobileNumber).subscribe({

      next: (response) => {

        this.isSendingOtp = false;

        console.log('OTP resent successfully', response);

      },

      error: (error) => {

        this.isSendingOtp = false;

        console.error('Resend OTP error:', error);

        this.otpError =
          error?.error?.message ||
          'Unable to resend OTP. Please try again.';
      }

    });
  }



  addRelatedToCart(item: Product): void {
    this.cartService.addToCart(item);
  }
}