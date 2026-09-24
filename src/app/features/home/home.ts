import { Component, OnDestroy, OnInit } from '@angular/core';
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
  imports: [
    CommonModule,
    RouterLink,
    FormsModule
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit, OnDestroy {

  // =====================================================
  // PRODUCTS
  // =====================================================

  bestSellerProducts: Product[] = [];

  products: Product[] = [];

  filteredProducts: Product[] = [];

  displayedProducts: Product[] = [];

  featuredIndex = 0;


  // =====================================================
  // FILTERS
  // =====================================================

  searchTerm = '';

  selectedCategory = 'All';

  selectedPrice = '';


  // =====================================================
  // HERO SLIDER
  // =====================================================

  sliderImages: string[] = [
    'assets/images/home/training-banner.png',
    'assets/images/home/vest-banner.png',
    'assets/images/home/track-pant-banner.png'
    
  ];

  currentSlide = 0;

  private sliderInterval?: ReturnType<typeof setInterval>;


  // =====================================================
  // BRANDS
  // =====================================================

  brands = [
    'Tata 1mg',
    'AJIO',
    'O.P. Jindal Global University',
    'IIT Roorkee'
  ];


  // =====================================================
  // TESTIMONIALS
  // =====================================================

  testimonials = [

    {
      company: 'Tata 1mg',
      review:
        'Excellent quality and timely delivery. The team exceeded our expectations.',
      author: 'Corporate Team'
    },

    {
      company: 'AJIO',
      review:
        'Professional manufacturing partner with premium finishing.',
      author: 'Brand Team'
    },

    {
      company: 'IIT Roorkee',
      review:
        'Our sports jerseys were delivered exactly as promised.',
      author: 'Sports Committee'
    },

    {
      company: 'O.P. Jindal Global University',
      review:
        'Highly recommended for bulk sportswear production.',
      author: 'Administration'
    }

  ];


  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private seoService: SeoService
  ) {}


  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {

    // ---------------------------------------------------
    // SEO
    // ---------------------------------------------------

    this.seoService.updateSeo(
      'TriangleSports®',
      'Premium Sportswear Manufacturer offering gym wear, jerseys, vests, activewear and custom team kits.',
      'Sportswear,Gym Wear,Triangle Sports,Team Jerseys,Vests'
    );


    // ---------------------------------------------------
    // LOAD PRODUCTS
    // ---------------------------------------------------

    this.productService.getProducts().subscribe({

      next: (response: any) => {

        const products: Product[] =
          Array.isArray(response?.products)
            ? response.products
            : [];


        this.products = products;


        this.filteredProducts =
          products.filter(
            product =>
              product.showOnHome !== false
          );


        // -------------------------------------------------
        // MOST LOVED PRODUCTS
        // -------------------------------------------------

        this.bestSellerProducts =
          this.filteredProducts.slice(0, 3);


        // -------------------------------------------------
        // FEATURED PRODUCTS
        // -------------------------------------------------

        this.updateFeaturedProducts();

      },


      error: (err) => {

        console.error(
          'Error fetching products:',
          err
        );

      }

    });


    // ---------------------------------------------------
    // HERO SLIDER
    // ---------------------------------------------------

    this.sliderInterval =
      setInterval(() => {

        this.nextSlide();

      }, 5000);

  }


  // =====================================================
  // DESTROY
  // =====================================================

  ngOnDestroy(): void {

    if (this.sliderInterval) {

      clearInterval(
        this.sliderInterval
      );

    }

  }


  // =====================================================
  // HERO SLIDER
  // =====================================================

  nextSlide(): void {

    if (
      !this.sliderImages.length
    ) {
      return;
    }

    this.currentSlide =
      (
        this.currentSlide + 1
      ) %
      this.sliderImages.length;

  }


  prevSlide(): void {

    if (
      !this.sliderImages.length
    ) {
      return;
    }

    this.currentSlide =
      (
        this.currentSlide -
        1 +
        this.sliderImages.length
      ) %
      this.sliderImages.length;

  }


  goToSlide(index: number): void {

    if (
      index < 0 ||
      index >= this.sliderImages.length
    ) {
      return;
    }

    this.currentSlide = index;

  }


  // =====================================================
  // FEATURED PRODUCTS
  // =====================================================

  updateFeaturedProducts(): void {

    this.displayedProducts =
      this.filteredProducts.slice(
        this.featuredIndex,
        this.featuredIndex + 3
      );

  }


  nextFeatured(): void {

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


  prevFeatured(): void {

    if (
      this.featuredIndex > 0
    ) {

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


  // =====================================================
  // CART
  // =====================================================

  addToCart(product: Product): void {

    this.cartService.addToCart(
      product
    );

    alert(
      `${product.name} added to cart`
    );

  }


  // =====================================================
  // FILTERS
  // =====================================================

  filterProducts(): void {

    const search =
      this.searchTerm
        .trim()
        .toLowerCase();


    this.filteredProducts =
      this.products.filter(
        product => {

          const showOnHome =
            product.showOnHome !== false;


          const productName =
            product.name?.toLowerCase() ||
            '';


          const matchesSearch =
            !search ||
            productName.includes(search);


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

        }
      );


    this.featuredIndex = 0;

    this.updateFeaturedProducts();

  }


  // =====================================================
  // CLOUDINARY IMAGE OPTIMIZATION
  // =====================================================

  getImageUrl(
    image: string | undefined,
    width = 480
  ): string {

    if (!image) {

      return 'assets/no-image.png';
    }

    if (image.includes('res.cloudinary.com')) {
      return image.replace(
        '/image/upload/',
        '/image/upload/w_1600,q_auto,f_auto/'
      );
    }

    return image;
  }
}


