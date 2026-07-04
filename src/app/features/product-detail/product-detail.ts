import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LoadingService } from '../../services/loading';
import { CartService } from '../../services/cart';
import { ProductService } from '../../services/product';
import { NotificationService } from '../../services/notification';
import { Router } from '@angular/router';

import { Product } from '../../models/product';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css'
})
export class ProductDetail implements OnInit {

  product?: Product;
  zoomTransform = 'scale(1)';
  zoomOrigin = 'center center';
  selectedSize = 'M';
  quantity = 1;
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

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private cartService: CartService,
    private notificationService: NotificationService,
    private loadingService: LoadingService,
    private router: Router
  ) { }

  ngOnInit(): void {

    const id = Number(
      this.route.snapshot.paramMap.get('id')
    );

    // Loading start
    this.loadingService.show();

    this.productService.getProductById(id)
      .subscribe({

        next: (data) => {

          this.product = data;

          this.productImages = data.images?.length
            ? data.images
            : [data.image];

          this.selectedImage = this.productImages[0];

          // Load reviews
          const savedReviews = localStorage.getItem(
            `reviews_${data.id}`
          );

          if (savedReviews) {
            this.reviews = JSON.parse(savedReviews);
          }

          // Related Products
          this.productService.getProducts()
            .subscribe(products => {

              this.relatedProducts = products
                .filter(p =>
                  p.category === data.category &&
                  p.id !== data.id
                )
                .slice(0, 4);

            });

          // Loading stop
          this.loadingService.hide();

        },

        error: (err) => {

          console.error('Error loading product:', err);

          // Error aaye tab bhi loader hide
          this.loadingService.hide();

        }

      });

    const savedPincode = localStorage.getItem('deliveryPincode');

    if (savedPincode) {

      this.pincode = savedPincode;

      this.isPincodeSaved = true;

      this.checkDelivery();
    }

  }

  increaseQuantity() {

    this.quantity++;

  }

  decreaseQuantity() {

    if (this.quantity > 1) {

      this.quantity--;

    }

  }

  addToCart() {

    if (this.product) {

      this.cartService.addToCart({
        ...this.product,
        quantity: this.quantity,
        selectedSize: this.selectedSize
      });

      this.notificationService.show(
        this.product.name + ' added to cart'
      );

    }

  }
  buyNow() {

    this.addToCart();

    this.router.navigate(['/checkout']);

  }

  submitReview() {

    if (
      this.newReview.name.trim() &&
      this.newReview.comment.trim()
    ) {

      this.reviews.push({

        ...this.newReview,

        date: new Date()

      });

      localStorage.setItem(

        `reviews_${this.product?.id}`,

        JSON.stringify(this.reviews)

      );

      this.newReview = {

        name: '',

        rating: 5,

        comment: ''

      };

    }

  }

  get averageRating(): number {

    if (this.reviews.length === 0) {

      return 0;

    }

    const total = this.reviews.reduce(

      (sum, review) => sum + review.rating,

      0

    );

    return total / this.reviews.length;

  }

  get roundedRating(): number {

    return Math.round(this.averageRating);

  }

  onMouseMove(event: MouseEvent) {

    const container = event.currentTarget as HTMLElement;

    const rect = container.getBoundingClientRect();

    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    this.zoomOrigin = `${x}% ${y}%`;

    this.zoomTransform = 'scale(2)';
  }

  resetZoom() {

    this.zoomTransform = 'scale(1)';
    this.zoomOrigin = 'center center';

  }

  checkDelivery() {

    if (!this.pincode || this.pincode.length !== 6) {

      this.deliveryMessage = 'Enter a valid Pincode';

      return;
    }

    localStorage.setItem(
      'deliveryPincode',
      this.pincode
    );

    this.isPincodeSaved = true;

    const today = new Date();
    const deliveryDate = new Date();

    if (
      this.pincode.startsWith('201') ||
      this.pincode.startsWith('110')
    ) {

      deliveryDate.setDate(today.getDate() + 2);

      this.deliveryCharge = 0;

    } else {

      deliveryDate.setDate(today.getDate() + 5);

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

  changePincode() {

    localStorage.removeItem('deliveryPincode');

    this.pincode = '';

    this.deliveryMessage = '';

    this.deliveryCharge = 99;

    this.isPincodeSaved = false;
  }
}