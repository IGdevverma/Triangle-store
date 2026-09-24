import {
  Component,
  OnInit
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';

import {
  FormsModule
} from '@angular/forms';

import {
  HttpClient
} from '@angular/common/http';

import {
  NgZone
} from '@angular/core';

import {
  LoadingService
} from '../../services/loading';

import {
  CartService
} from '../../services/cart';

import {
  ProductService
} from '../../services/product';

import {
  NotificationService
} from '../../services/notification';

import {
  SeoService
} from '../../services/seo';

import {
  OtpService
} from '../../services/otp.service';

import {
  Product,
  ProductPack,
  ColorCombination,
  ProductColor
} from '../../models/product';


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

  // =====================================================
  // PRODUCT
  // =====================================================

  product?: Product;


  // =====================================================
  // IMAGES
  // =====================================================

  productImages: string[] = [];

  selectedImage = '';

  zoomTransform = 'scale(1)';

  zoomOrigin = 'center center';


  // =====================================================
  // PRODUCT OPTIONS
  // =====================================================

  selectedSize = '';

  selectedColor = '';
  
  selectedPack = 'single';

  selectedCombination = '';

  quantity = 1;



  get cartQuantity(): number {

    if (!this.product) {
      return 0;
    }

    return this.cartService.getProductQuantity(
      this.product,
      this.selectedSize,
      this.selectedColor,
      this.selectedPack,
      this.selectedCombination
    );

  }
  get displayColor(): string {

    return (
      this.selectedColor ||
      this.product?.colors?.[0] ||
      'Select Color'
    );

  }


  // =====================================================
  // SELECTED OPTION DATA
  // =====================================================

  selectedPackData?: ProductPack;

  selectedCombinationData?: ColorCombination;

  selectedColorData?: ProductColor;


  // =====================================================
  // UI
  // =====================================================

  showProductDetails = false;

  showQualityGuarantee = false;

  showSizeGuide = false;


  // =====================================================
  // REVIEWS
  // =====================================================

  activeTab: 'description' | 'fabric' | 'reviews' | 'delivery' = 'description';

  reviews: any[] = [];

  newReview = {
    name: '',
    rating: 5,
    comment: ''
  };


  // =====================================================
  // RELATED PRODUCTS
  // =====================================================

  relatedProducts: Product[] = [];




  // =====================================================
  // PINCODE
  // =====================================================

  pincode = '';

  deliveryMessage = '';

  deliveryCharge = 99;

  isPincodeSaved = false;


  // =====================================================
  // BUY NOW
  // =====================================================

  showBuyNowModal = false;

  buyNowStep: 'mobile' | 'otp' | 'address' = 'mobile';

  mobileNumber = '';

  mobileError = '';

  isSendingOtp = false;

  isVerifyingOtp = false;

  resendDisabled = false;

  resendTimer = 0;

  otp = '';

  otpError = '';

  otpSent = false;


  // =====================================================
  // COUPON
  // =====================================================

  couponCode = '';

  couponMessage = '';


  // =====================================================
  // ADDRESS
  // =====================================================

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


  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    private notificationService: NotificationService,
    private loadingService: LoadingService,
    private http: HttpClient,
    private otpService: OtpService,
    private ngZone: NgZone,
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

    this.route.paramMap.subscribe(params => {

      const id = params.get('id');

      if (!id) {
        console.error('Product ID not found');
        return;
      }

      this.loadProduct(id);

    });

    this.loadSavedPincode();
  }


  // =====================================================
  // GETTERS
  // =====================================================

  get availableSizes(): string[] {

    return this.product?.sizes ?? [];

  }


  get availableColors(): string[] {

    return this.product?.colors ?? [];

  }


  get colorsData(): ProductColor[] {

    return this.product?.colorsData ?? [];

  }
  get hasPackOptions(): boolean {
    return !!this.product?.packs?.some(
      pack => Number(pack.quantity) > 1
    );
  }

  get availablePacks(): ProductPack[] {

    if (!this.product) {
      return [];
    }

    // ==========================================
    // SINGLE PRODUCT OPTION
    // ==========================================
    const singlePack: ProductPack = {
      id: 'single',
      name: 'Single',
      quantity: 1,

      price: Number(this.product.price ?? 0),

      originalPrice: Number(
        this.product.originalPrice ??
        this.product.price ??
        0
      ),

      discount: Number(
        this.product.discount ?? 0
      ),

      colors: this.product.colors ?? [],
      sizes: this.product.sizes ?? [],

      images: [],
      image: this.product.image || ''
    };

    // ==========================================
    // ADMIN CREATED PACKS
    // ==========================================
    const adminPacks = (this.product.packs ?? [])
      .filter(pack => Number(pack.quantity) > 1)
      .sort(
        (a, b) =>
          Number(a.quantity) -
          Number(b.quantity)
      );

    // ==========================================
    // FINAL OPTIONS
    // ==========================================
    return [
      singlePack,
      ...adminPacks
    ];

  }


  // =====================================================
  // AVAILABLE PACK COMBINATIONS
  // =====================================================

  get availableCombinations(): ColorCombination[] {

    if (!this.selectedPackData) {
      return [];
    }

    return this.selectedPackData.combinations || [];

  }


  get currentPack(): ProductPack | undefined {

    return this.selectedPackData;

  }


  get currentPrice(): number {

    if (this.selectedPackData?.price !== undefined) {

      return Number(this.selectedPackData.price);

    }

    return Number(this.product?.price ?? 0);

  }


  get currentOriginalPrice(): number {

    if (
      this.selectedPackData?.originalPrice !== undefined
    ) {

      return Number(
        this.selectedPackData.originalPrice
      );

    }

    return Number(
      this.product?.originalPrice ??
      this.product?.price ??
      0
    );

  }


  get currentDiscount(): number {

    if (
      this.selectedPackData?.discount !== undefined
    ) {

      return Number(
        this.selectedPackData.discount
      );

    }

    return Number(
      this.product?.discount ?? 0
    );

  }


  get totalPrice(): number {

    return this.currentPrice;

  }


  // =====================================================
  // SIZE
  // =====================================================

  selectSize(size: string): void {

    this.selectedSize = size;

  }


  // =====================================================
  // COLOR
  // =====================================================
  selectColor(color: string): void {

    this.selectedColor = color;

    this.selectedCombination = '';
    this.selectedCombinationData = undefined;

    const colorData = this.colorsData.find(
      item =>
        item.name?.toLowerCase() ===
        color?.toLowerCase()
    );

    this.selectedColorData = colorData;

    const colorImage =
      colorData?.image ||
      this.getSelectedColorImage();

    if (colorImage) {
      this.setProductImage(colorImage);
    }
  }

  getSelectedColorImage(): string {

    if (!this.product) {
      return '';
    }

    const color =
      this.selectedColor?.trim().toLowerCase();

    if (!color) {
      return '';
    }

    /*
     * =====================================================
     * PRIMARY SOURCE
     * Explicit color → image mapping from Admin
     * =====================================================
     */

    const colorData =
      this.product.colorsData?.find(
        item =>
          item.name?.trim().toLowerCase() === color &&
          !!item.image
      );

    if (colorData?.image) {
      return colorData.image;
    }


    /*
     * =====================================================
     * LEGACY FALLBACK
     *
     * Old products may not have colorsData yet.
     * Keep the old image-order system for them.
     * =====================================================
     */

    const colorIndex =
      this.product.colors?.findIndex(
        c =>
          c?.trim().toLowerCase() === color
      ) ?? -1;

    if (
      colorIndex >= 0 &&
      this.product.images &&
      this.product.images[colorIndex + 1]
    ) {
      return this.product.images[colorIndex + 1];
    }

    return '';
  }

  getPackDisplayImage(pack: ProductPack): string {

    // ==========================================
    // SINGLE PRODUCT
    // ==========================================
    if (pack.quantity === 1) {

      // Selected colour ki individual image
      const colorImage = this.getSelectedColorImage();

      if (colorImage) {
        return colorImage;
      }

      // Fallback: first product image
      return (
        this.product?.images?.[1] ||
        this.product?.image ||
        this.product?.images?.[0] ||
        ''
      );
    }

    // ==========================================
    // 2 PACK / 3 PACK / FUTURE PACKS
    // ==========================================
    return (
      pack.images?.[0] ||
      pack.image ||
      this.product?.image ||
      this.product?.images?.[0] ||
      ''
    );
  }

  // =====================================================
  // PACK
  // =====================================================
  selectPack(pack: ProductPack): void {

    this.selectedPack = pack.id;
    this.selectedPackData = pack;

    // Reset combination
    this.selectedCombination = '';
    this.selectedCombinationData = undefined;

    // ==========================================
    // SINGLE
    // ==========================================
    if (pack.quantity === 1) {

      this.productImages =
        this.product?.images?.length
          ? [...this.product.images]
          : this.product?.image
            ? [this.product.image]
            : [];

      const colorImage = this.getSelectedColorImage();

      this.selectedImage =
        colorImage ||
        this.productImages[0] ||
        '';

    }

    // ==========================================
    // 3 PACK
    // ==========================================
    else if (pack.quantity === 3) {

      // 3-pack ki apni images ONLY
      this.productImages =
        pack.images?.length
          ? [...pack.images]
          : pack.image
            ? [pack.image]
            : [];

      this.selectedImage =
        this.productImages[0] ||
        '';

    }

    // ==========================================
    // OTHER PACKS — 2 PACK etc.
    // ==========================================
    else if (pack.images?.length) {

      this.productImages = [
        ...pack.images
      ];

      this.selectedImage =
        this.productImages[0] ||
        '';

    }

    else if (pack.image) {

      this.productImages = [
        pack.image
      ];

      this.selectedImage =
        pack.image;

    }

    // ==========================================
    // FALLBACK
    // ==========================================
    else {

      this.productImages =
        this.product?.images?.length
          ? [...this.product.images]
          : this.product?.image
            ? [this.product.image]
            : [];

      this.selectedImage =
        this.productImages[0] ||
        '';

    }

    this.resetZoom();

    console.log('Selected Pack:', pack);
    console.log('Pack Quantity:', pack.quantity);
    console.log('Pack Images:', this.productImages);
  }

  // =====================================================
  // COLOR COMBINATION
  // =====================================================

  selectCombination(
    combination: ColorCombination
  ): void {

    this.selectedCombination =
      combination.id;

    this.selectedCombinationData =
      combination;

    if (combination.colors?.length) {

      this.selectedColor =
        combination.colors.join(' + ');

    }

    if (
      combination.images?.length
    ) {

      this.productImages =
        [...combination.images];

      this.selectedImage =
        this.productImages[0] ?? '';

    }

  }


  private addCurrentVariantToCart(quantity: number): void {

    if (!this.product) {
      return;
    }

    this.cartService.addToCart(
      this.product,
      quantity,
      this.selectedSize,
      this.selectedColor,
      this.selectedPack,
      this.selectedCombination
    );

  }
  // =====================================================
  // QUANTITY
  // =====================================================

  increaseQuantity(): void {

    if (!this.product) {
      return;
    }

    const stock =
      Number(this.product.stock ?? 0);

    if (stock <= 0) {

      this.notificationService.show(
        'This product is Out of Stock'
      );

      return;
    }

    this.cartService.increaseProductQuantity(
      this.product,
      this.selectedSize,
      this.selectedColor,
      this.selectedPack,
      this.selectedCombination
    );

  }





  decreaseQuantity(): void {

    if (!this.product) {
      return;
    }

    const currentQuantity =
      this.cartService.getProductQuantity(
        this.product,
        this.selectedSize,
        this.selectedColor,
        this.selectedPack,
        this.selectedCombination
      );

    // Quantity 0 ya 1 hai
    // Product detail par decrease mat karo
    if (currentQuantity <= 1) {
      return;
    }

    this.cartService.decreaseProductQuantity(
      this.product,
      this.selectedSize,
      this.selectedColor,
      this.selectedPack,
      this.selectedCombination
    );

  }


  // =====================================================
  // ADD TO CART
  // =====================================================

  addToCart(): void {

    if (!this.product) {
      return;
    }

    const stock =
      Number(this.product.stock ?? 0);

    if (stock <= 0) {

      this.notificationService.show(
        'This product is Out of Stock'
      );

      return;
    }

    if (this.quantity > stock) {

      this.notificationService.show(
        `Only ${stock} items available`
      );

      return;
    }


    // ---------------------------------------------------
    // IMPORTANT
    // Pass ALL selected options to CartService
    // ---------------------------------------------------

    this.cartService.addToCart(
      this.product,
      1,
      this.selectedSize,
      this.selectedColor,
      this.selectedPack,
      this.selectedCombination,
      this.selectedImage
    );


    // ---------------------------------------------------
    // SUCCESS
    // ---------------------------------------------------

    this.notificationService.show(
      `${this.product.name} added to cart`
    );

  }


  // =====================================================
  // BUY NOW
  // =====================================================

  buyNow(): void {

    if (!this.product) {
      return;
    }

    const stock =
      Number(this.product.stock ?? 0);

    if (stock <= 0) {

      this.notificationService.show(
        'This product is Out of Stock'
      );

      return;
    }

    if (this.quantity > stock) {

      this.notificationService.show(
        `Only ${stock} items available`
      );

      return;
    }


    // ---------------------------------------------------
    // Store exact selected product variant
    // ---------------------------------------------------
    this.cartService.setBuyNowItem(
      this.product,
      this.quantity,
      this.selectedSize,
      this.selectedColor,
      this.selectedPack,
      this.selectedCombination,
      this.selectedImage
    );


    // ---------------------------------------------------
    // Checkout
    // ---------------------------------------------------

    this.router.navigate([
      '/checkout'
    ]);

  }


  getOptimizedImage(
    imageUrl: string,
    width: number = 800
  ): string {

    if (!imageUrl) {
      return '';
    }

    // Only optimize Cloudinary images
    if (!imageUrl.includes('res.cloudinary.com')) {
      return imageUrl;
    }

    // Avoid applying transformation twice
    if (imageUrl.includes('/f_auto,q_auto')) {
      return imageUrl;
    }

    return imageUrl.replace(
      '/image/upload/',
      `/image/upload/f_auto,q_auto,w_${width}/`
    );
  }


  // =====================================================
  // IMAGE
  // =====================================================

  setProductImage(image: string): void {

    if (!image) {
      return;
    }

    this.selectedImage = image;

    this.resetZoom();

  }


  selectImage(image: string): void {

    this.setProductImage(image);

    const colorData = this.colorsData.find(
      item => item.image === image
    );

    if (colorData) {
      this.selectedColor = colorData.name;
      this.selectedColorData = colorData;
      return;
    }

    // Individual colour images:
    if (this.product?.images) {

      const imageIndex =
        this.product.images.indexOf(image);

      // index 0 = combined image
      if (imageIndex > 0) {

        const color =
          this.product.colors?.[imageIndex - 1];

        if (color) {
          this.selectedColor = color;
        }
      }
    }

    this.selectedCombination = '';
    this.selectedCombinationData = undefined;
  }


  // =====================================================
  // IMAGE ZOOM
  // =====================================================

  onMouseMove(
    event: MouseEvent
  ): void {

    const container =
      event.currentTarget as HTMLElement;

    if (!container) {
      return;
    }

    const rect =
      container.getBoundingClientRect();

    if (
      rect.width === 0 ||
      rect.height === 0
    ) {
      return;
    }

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
  // PRODUCT DETAILS
  // =====================================================

  toggleProductDetails(): void {

    this.showProductDetails =
      !this.showProductDetails;

  }


  // =====================================================
  // LOAD PRODUCT
  // =====================================================

  loadProduct(id: string): void {

    this.loadingService.show();

    this.productService
      .getProductById(id)
      .subscribe({

        next: (response: any) => {

          const product =
            response?.product as Product;

          if (!product) {

            console.error(
              'Product not found'
            );

            this.loadingService.hide();

            return;
          }

          this.product =
            product;



          console.log(
            'PACK DATA FROM API:',
            product.packs?.map(pack => ({
              id: pack.id,
              name: pack.name,
              quantity: pack.quantity,
              combinations: pack.combinations
            }))
          );


          // ------------------------------------------------
          // IMAGES
          // ------------------------------------------------

          this.productImages =
            product.images?.length
              ? [...product.images]
              : product.image
                ? [product.image]
                : [];

          this.selectedImage =
            this.productImages[0] ?? '';


          // ------------------------------------------------
          // OPTIONS
          // ------------------------------------------------

          this.initializeProductOptions(
            product
          );


          // ------------------------------------------------
          // REVIEWS
          // ------------------------------------------------

          this.loadReviews(product);


          // ------------------------------------------------
          // SEO
          // ------------------------------------------------

          this.seoService.updateSeo(

            `${product.name} | Triangle Sports®`,

            product.description ||
            'Premium sportswear by Triangle Sports.',

            [
              product.category,
              product.brand,
              product.type,
              'Sportswear',
              'Gym Wear'
            ]
              .filter(Boolean)
              .join(', ')

          );


          // ------------------------------------------------
          // RELATED PRODUCTS
          // ------------------------------------------------

          // ------------------------------------------------
          // MAIN PRODUCT PAGE READY
          // ------------------------------------------------

          this.loadingService.hide();


          // ------------------------------------------------
          // RELATED PRODUCTS
          // ------------------------------------------------
          // Load separately without blocking the page.

          this.loadRelatedProducts(product);

        },

        error: error => {

          console.error(
            'Error loading product:',
            error
          );

          this.loadingService.hide();

        }

      });

  }


  // =====================================================
  // INITIALIZE OPTIONS
  // =====================================================

  private initializeProductOptions(
    product: Product
  ): void {

    // ---------------------------------------------------
    // SIZE
    // ---------------------------------------------------

    this.selectedSize =
      product.sizes?.[0] ?? '';


    // ---------------------------------------------------
    // COLOR
    // ---------------------------------------------------

    this.selectedColor =
      product.colors?.[0] ?? '';


    // ---------------------------------------------------
    // PACK
    // ---------------------------------------------------

    if (product.packs?.length) {

      const defaultPack =
        product.packs.find(
          pack =>
            pack.id === 'single'
        ) ??
        product.packs[0];

      this.selectedPack =
        defaultPack.id;

      this.selectedPackData =
        defaultPack;

    }
    else {

      this.selectedPack =
        'single';

      this.selectedPackData =
        undefined;

    }


    // ---------------------------------------------------
    // COMBINATION
    // ---------------------------------------------------

    this.selectedCombination =
      '';

    this.selectedCombinationData =
      undefined;


    // ---------------------------------------------------
    // QUANTITY
    // ---------------------------------------------------

    this.quantity = 1;







  }





  // =====================================================
  // REVIEWS
  // =====================================================

  private loadReviews(
    product: Product
  ): void {

    const productId =
      product._id ??
      product.id;

    if (!productId) {

      this.reviews = [];

      return;
    }

    const storageKey =
      `reviews_${productId}`;

    const savedReviews =
      localStorage.getItem(storageKey);

    if (!savedReviews) {

      this.reviews = [];

      return;
    }

    try {

      const parsed =
        JSON.parse(savedReviews);

      this.reviews =
        Array.isArray(parsed)
          ? parsed
          : [];

    }
    catch (error) {

      console.error(
        'Error parsing reviews:',
        error
      );

      this.reviews = [];

    }

  }


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

    const productId =
      this.product._id ??
      this.product.id;

    if (!productId) {
      return;
    }

    const review = {

      name:
        this.newReview.name.trim(),

      rating:
        this.newReview.rating,

      comment:
        this.newReview.comment.trim(),

      date:
        new Date().toISOString()

    };

    this.reviews.push(review);

    localStorage.setItem(

      `reviews_${productId}`,

      JSON.stringify(
        this.reviews
      )

    );

    this.newReview = {

      name: '',
      rating: 5,
      comment: ''

    };

  }


  get averageRating(): number {

    if (!this.reviews.length) {
      return 0;
    }

    const total =
      this.reviews.reduce(
        (sum, review) =>
          sum +
          Number(review?.rating ?? 0),
        0
      );

    return total /
      this.reviews.length;

  }


  get roundedRating(): number {

    return Math.round(
      this.averageRating
    );

  }


  // =====================================================
  // PINCODE
  // =====================================================

  private loadSavedPincode(): void {

    const saved =
      localStorage.getItem(
        'deliveryPincode'
      );

    if (!saved) {
      return;
    }

    this.pincode =
      saved;

    this.isPincodeSaved =
      true;

    this.checkDelivery();

  }


  checkDelivery(): void {

    if (
      !/^\d{6}$/.test(
        this.pincode
      )
    ) {

      this.deliveryMessage =
        'Enter a valid 6-digit Pincode';

      this.isPincodeSaved =
        false;

      return;

    }

    localStorage.setItem(
      'deliveryPincode',
      this.pincode
    );

    this.isPincodeSaved =
      true;


    const today =
      new Date();

    const deliveryDate =
      new Date(today);


    // Delhi / NCR
    if (
      this.pincode.startsWith('201') ||
      this.pincode.startsWith('110')
    ) {

      deliveryDate.setDate(
        today.getDate() + 2
      );

      this.deliveryCharge = 0;

    }
    else {

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


  // =====================================================
  // MOBILE
  // =====================================================

  onMobileInput(): void {

    this.mobileNumber =
      this.mobileNumber
        .replace(/\D/g, '')
        .slice(0, 10);

    this.mobileError = '';

  }


  validateMobile(): boolean {

    const mobile =
      this.mobileNumber.trim();

    if (!mobile) {

      this.mobileError =
        'Please enter your mobile number';

      return false;

    }

    if (
      !/^[6-9]\d{9}$/.test(
        mobile
      )
    ) {

      this.mobileError =
        'Please enter a valid 10-digit mobile number';

      return false;

    }

    this.mobileError = '';

    return true;

  }


  // =====================================================
  // CONTINUE TO CHECKOUT
  // =====================================================

  continueToCheckout(): void {

    this.mobileError = '';

    const mobile =
      this.mobileNumber
        .replace(/\D/g, '');

    if (!mobile) {

      this.mobileError =
        'Please enter your mobile number';

      return;

    }

    if (
      !/^[6-9]\d{9}$/.test(
        mobile
      )
    ) {

      this.mobileError =
        'Please enter a valid 10-digit mobile number';

      return;

    }

    this.mobileNumber =
      mobile;

    this.sendOtp();

  }


  // =====================================================
  // SEND OTP
  // =====================================================

  sendOtp(): void {

    if (!this.validateMobile()) {
      return;
    }

    this.isSendingOtp = true;

    this.otpError = '';

    this.otpService.sendOtp(

      '91' + this.mobileNumber,

      response => {

        console.log(
          'OTP SEND RESPONSE:',
          response
        );

        this.ngZone.run(() => {

          this.isSendingOtp =
            false;

          this.otpSent =
            true;

          this.buyNowStep =
            'otp';

        });

      },

      error => {

        console.error(
          'OTP SEND ERROR:',
          error
        );

        this.ngZone.run(() => {

          this.isSendingOtp =
            false;

          this.otpError =
            error?.message ??
            'Unable to send OTP. Please try again.';

        });

      }

    );

  }


  // =====================================================
  // OTP INPUT
  // =====================================================

  onOtpInput(): void {

    this.otp =
      this.otp
        .replace(/\D/g, '')
        .slice(0, 6);

    this.otpError = '';

  }


  // =====================================================
  // VERIFY OTP
  // =====================================================

  verifyOtp(): void {

    this.otpError = '';

    if (!this.otp) {

      this.otpError =
        'Please enter OTP';

      return;

    }

    if (
      !/^\d{4}$|^\d{6}$/.test(
        this.otp
      )
    ) {

      this.otpError =
        'Please enter a valid OTP';

      return;

    }

    this.isVerifyingOtp = true;

    this.otpService.verifyOtp(

      this.otp,

      response => {

        this.isVerifyingOtp =
          false;

        console.log(
          'OTP VERIFIED:',
          response
        );

        const accessToken =
          response?.token ??
          response?.accessToken ??
          response?.['access-token'];

        if (!accessToken) {

          this.otpError =
            'OTP verified but access token was not received.';

          return;

        }

        this.verifyAccessTokenOnBackend(
          accessToken
        );

      },

      error => {

        this.isVerifyingOtp =
          false;

        console.error(
          'OTP VERIFY ERROR:',
          error
        );

        this.otpError =
          'Invalid OTP. Please try again.';

      }

    );

  }


  // =====================================================
  // RESEND OTP
  // =====================================================

  resendOtp(): void {

    if (!this.mobileNumber) {

      this.mobileError =
        'Mobile number is missing.';

      return;

    }

    this.otpError = '';

    this.isSendingOtp = true;

    this.otpService.retryOtp(

      null,

      response => {

        this.isSendingOtp =
          false;

        console.log(
          'OTP RESENT:',
          response
        );

      },

      error => {

        this.isSendingOtp =
          false;

        console.error(
          'RESEND OTP ERROR:',
          error
        );

        this.otpError =
          error?.message ??
          'Unable to resend OTP. Please try again.';

      }

    );

  }


  // =====================================================
  // BACKEND TOKEN VERIFICATION
  // =====================================================

  private verifyAccessTokenOnBackend(
    accessToken: string
  ): void {

    this.http
      .post<any>(
        'http://localhost:8000/api/auth/verify-widget-token',
        {
          accessToken,
          phone: this.mobileNumber
        }
      )
      .subscribe({

        next: response => {

          console.log(
            'BACKEND OTP VERIFICATION:',
            response
          );

          if (response?.success) {

            this.showBuyNowModal =
              false;

            this.router.navigate([
              '/checkout'
            ]);

          }

        },

        error: error => {

          console.error(
            'Backend token verification failed:',
            error
          );

          this.otpError =
            error?.error?.message ??
            'OTP verification failed.';

        }

      });

  }


  // =====================================================
  // ADDRESS
  // =====================================================

  validateAddress(): boolean {

    const a =
      this.address;

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

    console.log(
      'Address saved:',
      this.address
    );

  }


  // =====================================================
  // COUPON
  // =====================================================

  applyCoupon(): void {

    const code =
      this.couponCode
        .trim()
        .toUpperCase();

    if (!code) {

      this.couponMessage =
        'Please enter a coupon code';

      return;

    }

    if (code === 'TRIANGLE10') {

      this.couponMessage =
        'Coupon applied successfully';

      return;

    }

    this.couponMessage =
      'Invalid coupon code';

  }


  // =====================================================
  // CLOSE BUY NOW MODAL
  // =====================================================

  closeBuyNowModal(): void {

    this.showBuyNowModal =
      false;

    this.buyNowStep =
      'mobile';

    this.mobileNumber = '';

    this.mobileError = '';

    this.otp = '';

    this.otpError = '';

    this.otpSent = false;

    this.couponCode = '';

    this.couponMessage = '';

    this.addressError = '';

  }


  // =====================================================
  // RELATED PRODUCTS
  // =====================================================
  addRelatedToCart(item: Product): void {

    this.cartService.addToCart(
      item,
      1,
      item.selectedSize || this.selectedSize,
      item.selectedColor,
      'single',
      ''
    );

    this.notificationService.show(
      `${item.name} - ${item.selectedColor} added to cart`
    );

  }


  // =====================================================
  // LOAD RELATED PRODUCTS
  // =====================================================

  private loadRelatedProducts(product: Product): void {

    // Related products are secondary content.
    // Do not block the main product page while loading them.
    this.relatedProducts = [];

    const load = () => {

      this.productService.getProducts().subscribe({

        next: (response: any) => {

          const products =
            (response?.products ?? []) as Product[];

          const currentProductId =
            product._id ?? product.id;

          const currentGroup =
            product.productGroup
              ?.trim()
              .toLowerCase()
              .replace(/[\s_]+/g, '-');

          // No product group = no recommendations
          if (!currentGroup) {
            this.relatedProducts = [];
            return;
          }

          this.relatedProducts = products

            // Same product family
            .filter(item => {

              const itemId =
                item._id ?? item.id;

              const itemGroup =
                item.productGroup
                  ?.trim()
                  .toLowerCase()
                  .replace(/[\s_]+/g, '-');

              const itemMode =
                item.productMode
                  ?.trim()
                  .toLowerCase();

              return (
                itemGroup === currentGroup &&
                itemMode === 'single' &&
                itemId !== currentProductId &&
                item.status !== 'Hidden'
              );

            })

            // Remove duplicates
            .filter(
              (item, index, array) =>
                array.findIndex(
                  x =>
                    (x._id ?? x.id) ===
                    (item._id ?? item.id)
                ) === index
            )

            // Maximum 4
            .slice(0, 4);

        },

        error: error => {

          console.error(
            'Error loading related products:',
            error
          );

          this.relatedProducts = [];

        }

      });

    };

    // Give the main product page priority.
    // Related products can load after the first render.
    if ('requestIdleCallback' in window) {

      (window as any).requestIdleCallback(
        load,
        { timeout: 2000 }
      );

    } else {

      setTimeout(load, 1000);

    }

  }
  previousImage(): void {
    if (!this.productImages.length) {
      return;
    }

    const currentIndex = this.productImages.indexOf(this.selectedImage);

    const previousIndex =
      currentIndex <= 0
        ? this.productImages.length - 1
        : currentIndex - 1;

    this.selectedImage = this.productImages[previousIndex];
  }


  nextImage(): void {
    if (!this.productImages.length) {
      return;
    }

    const currentIndex = this.productImages.indexOf(this.selectedImage);

    const nextIndex =
      currentIndex >= this.productImages.length - 1
        ? 0
        : currentIndex + 1;

    this.selectedImage = this.productImages[nextIndex];
  }

}