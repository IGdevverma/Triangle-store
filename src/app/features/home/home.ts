import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../models/product';
import { ProductService } from '../../services/product';
import { CartService } from '../../services/cart';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SeoService } from '../../services/seo';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})


export class Home implements OnInit {
  bestSellerProducts: Product[] = [];
  products: Product[] = [];
  filteredProducts: Product[] = [];

  /* Tyka Style Featured Products */
  displayedProducts: Product[] = [];
  featuredIndex = 0;

  searchTerm = '';
  selectedCategory = 'All';
  selectedPrice = '';

  /* Hero Slider */
  sliderImages = [
    'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1600',
    'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1600',
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1600'
  ];

  currentSlide = 0;

  /* Brands */
  brands = [
    'Tata 1mg',
    'AJIO',
    'O.P. Jindal Global University',
    'IIT Roorkee'
  ];
  /* Testimonials */

  testimonials = [

    {
      company: 'Tata 1mg',
      review: 'Excellent quality and timely delivery. The team exceeded our expectations.',
      author: 'Corporate Team'
    },

    {
      company: 'AJIO',
      review: 'Professional manufacturing partner with premium finishing.',
      author: 'Brand Team'
    },

    {
      company: 'IIT Roorkee',
      review: 'Our sports jerseys were delivered exactly as promised.',
      author: 'Sports Committee'
    },

    {
      company: 'O.P. Jindal Global University',
      review: 'Highly recommended for bulk sportswear production.',
      author: 'Administration'
    }

  ];

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private seoService: SeoService
  ) { }

  ngOnInit(): void {

    /* Update SEO */
    this.seoService.updateSeo(
      'Triangle Sports | Premium Sportswear Manufacturer',

      'Premium Sportswear Manufacturer offering gym wear, jerseys, vests, activewear and custom team kits.',

      'Sportswear,Gym Wear,Triangle Sports,Team Jerseys,Vests'
    );

    /* Load Products */
    /* Load Products */
    this.productService.getProducts().subscribe({

      next: (response: any) => {


        this.products = response.products || [];

        this.filteredProducts = response.products.filter(
          (product: Product) => product.showOnHome !== false
        );

        /* ===============================
   MOST LOVED PRODUCTS
   =============================== */

        this.bestSellerProducts = response.products
          .filter((product: Product) => product.showOnHome !== false)
          .slice(0, 3);

        console.log(
          'MOST LOVED PRODUCTS:',
          this.bestSellerProducts
        );

        /* ===============================
           FEATURED PRODUCTS
           =============================== */

        this.updateFeaturedProducts();

      },

      error: (err) => {

        console.error(
          'Error fetching products:',
          err
        );

      }

    });

    /* Auto Hero Slider */
    setInterval(() => {

      this.nextSlide();

    }, 4000);

  }



  /* ================= HERO SLIDER ================= */

  nextSlide() {

    this.currentSlide =
      (this.currentSlide + 1) %
      this.sliderImages.length;

  }

  prevSlide() {

    this.currentSlide =
      (
        this.currentSlide - 1 +
        this.sliderImages.length
      ) %
      this.sliderImages.length;

  }

  goToSlide(index: number) {

    this.currentSlide = index;

  }



  /* ================= FEATURED PRODUCTS ================= */

  updateFeaturedProducts() {

    this.displayedProducts =
      this.filteredProducts.slice(
        this.featuredIndex,
        this.featuredIndex + 3
      );

  }

  nextFeatured() {

    if (
      this.featuredIndex + 3 <
      this.filteredProducts.length
    ) {

      this.featuredIndex++;

    } else {

      this.featuredIndex = 0;

    }

    this.updateFeaturedProducts();

  }

  prevFeatured() {

    if (this.featuredIndex > 0) {

      this.featuredIndex--;

    } else {

      this.featuredIndex =
        Math.max(
          this.filteredProducts.length - 3,
          0
        );

    }

    this.updateFeaturedProducts();

  }

  /* ================= CART ================= */

  addToCart(product: Product) {

    this.cartService.addToCart(product);

    alert(
      product.name +
      ' added to cart'
    );

  }

  /* ================= FILTERS ================= */

  filterProducts() {

    this.filteredProducts =
      this.products.filter(product => {

        const showOnHome =
          product.showOnHome !== false;

        const matchesSearch =
          product.name
            .toLowerCase()
            .includes(
              this.searchTerm.toLowerCase()
            );

        const matchesCategory =

          this.selectedCategory === 'All' ||

          product.category ===
          this.selectedCategory;

        let matchesPrice = true;

        if (
          this.selectedPrice ===
          'under1000'
        ) {

          matchesPrice =
            product.price < 1000;

        }

        else if (
          this.selectedPrice ===
          '1000to3000'
        ) {

          matchesPrice =

            product.price >= 1000 &&

            product.price <= 3000;

        }

        else if (
          this.selectedPrice ===
          'above3000'
        ) {

          matchesPrice =
            product.price > 3000;

        }

        return (

          showOnHome &&

          matchesSearch &&

          matchesCategory &&

          matchesPrice

        );

      });

    this.featuredIndex = 0;

    this.updateFeaturedProducts();

  }

  getImageUrl(image: string): string {

    if (!image) {
      return 'assets/no-image.png';
    }

    if (image.startsWith('http')) {
      return image;
    }

    return image;

  }


}