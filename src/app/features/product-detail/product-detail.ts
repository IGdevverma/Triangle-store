import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CartService } from '../../services/cart';
import { ProductService } from '../../services/product';
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

  selectedSize = 'M';
  quantity = 1;
  selectedImage = '';

  relatedProducts: Product[] = [];
  sizes = ['S', 'M', 'L', 'XL'];
  productImages: string[] = [];
  activeTab: 'description' | 'reviews' = 'description';

  // Reviews
  reviews: any[] = [];

  newReview = {
    name: '',
    rating: 5,
    comment: ''
  };

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private cartService: CartService
  ) { }

  ngOnInit(): void {

    const id = Number(
      this.route.snapshot.paramMap.get('id')
    );

    this.productService.getProductById(id)
      .subscribe(data => {

        this.product = data;

        this.selectedImage = data.image;

        this.productImages = [
          data.image,
          data.image,
          data.image
        ];

        // Load reviews
        const savedReviews = localStorage.getItem(
          `reviews_${data.id}`
        );

        if (savedReviews) {
          this.reviews = JSON.parse(savedReviews);
        }

        // Related products
        this.productService.getProducts()
          .subscribe(products => {

            this.relatedProducts = products
              .filter(p =>
                p.category === data.category &&
                p.id !== data.id
              )
              .slice(0, 4);

          });

      });
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

      this.cartService.addToCart(this.product);

      alert(this.product.name + ' added to cart');

    }

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

}