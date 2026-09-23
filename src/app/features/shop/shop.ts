import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';

import { Product } from '../../models/product';
import { ProductService } from '../../services/product';
import { CartService } from '../../services/cart';
import { WishlistService } from '../../services/wishlist';
import { NotificationService } from '../../services/notification';
import { LoadingService } from '../../services/loading';
import { SeoService } from '../../services/seo';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './shop.html',
  styleUrl: './shop.css'
})
export class Shop implements OnInit {

  /* =========================================================
     DATA
  ========================================================= */

  products: Product[] = [];
  filteredProducts: Product[] = [];

  selectedProduct: Product | null = null;

  /* =========================================================
     FILTER STATE
  ========================================================= */

  selectedCategory = 'All';
  selectedPrice = '';
  selectedAvailability = 'all';

  selectedSort = 'latest';
  searchTerm = '';

  /* =========================================================
     UI STATE
  ========================================================= */

  isLoading = false;

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private wishlistService: WishlistService,
    private notificationService: NotificationService,
    private loadingService: LoadingService,
    private route: ActivatedRoute,
    private seoService: SeoService
  ) { }

  ngOnInit(): void {

    this.seoService.updateSeo(
      'Shop Sportswear | Triangle Sports',
      'Browse premium sportswear including vests, shorts, track pants, jerseys and compression wear.',
      'Sportswear Shop,Gym Wear,Track Pants,Vests'
    );

    this.loadProducts();
  }

  /* =========================================================
     LOAD PRODUCTS
  ========================================================= */

  private loadProducts(): void {

    this.isLoading = true;
    this.loadingService.show();

    this.productService.getProducts().subscribe({

      next: (response: any) => {

        console.log('SHOP API RESPONSE:', response);

        /*
         * Backend normally returns:
         * {
         *   products: [...]
         * }
         *
         * But this also safely supports:
         * [...]
         */
        const apiProducts =
          Array.isArray(response)
            ? response
            : Array.isArray(response?.products)
              ? response.products
              : [];

        this.products = apiProducts;

        console.log('SHOP PRODUCTS:', this.products);
        console.log('SHOP PRODUCT COUNT:', this.products.length);

        this.route.queryParams.subscribe(params => {

          this.searchTerm =
            typeof params['search'] === 'string'
              ? params['search']
              : '';

          this.filterProducts();

        });

        this.isLoading = false;
        this.loadingService.hide();

      },

      error: (error) => {

        console.error(
          'SHOP PRODUCTS API ERROR:',
          error
        );

        this.products = [];
        this.filteredProducts = [];

        this.isLoading = false;
        this.loadingService.hide();

      }

    });
  }

  /* =========================================================
     FILTER + SORT
  ========================================================= */
  filterProducts(): void {

    const keyword = this.searchTerm
      .toLowerCase()
      .trim();

    let result = this.products.filter(product => {

      const productName =
        String(product.name || '').toLowerCase();

      const productCategory =
        String(product.category || '').toLowerCase();

      const productDescription =
        String(product.description || '').toLowerCase();

      const productBrand =
        String(product.brand || '').toLowerCase();

      const productType =
        String(product.type || '').toLowerCase();


      /* CATEGORY */

      const matchesCategory =
        this.selectedCategory === 'All' ||
        product.category === this.selectedCategory;


      /* SEARCH */

      const matchesSearch =
        !keyword ||
        productName.includes(keyword) ||
        productCategory.includes(keyword) ||
        productDescription.includes(keyword) ||
        productBrand.includes(keyword) ||
        productType.includes(keyword);


      /* PRICE */

      let matchesPrice = true;

      if (this.selectedPrice === 'under1000') {

        matchesPrice =
          Number(product.price) < 1000;

      }

      else if (this.selectedPrice === '1000to3000') {

        matchesPrice =
          Number(product.price) >= 1000 &&
          Number(product.price) <= 3000;

      }

      else if (this.selectedPrice === 'above3000') {

        matchesPrice =
          Number(product.price) > 3000;

      }


      /* AVAILABILITY */

      let matchesAvailability = true;

      if (this.selectedAvailability === 'inStock') {

        matchesAvailability =
          Number(product.stock) > 0;

      }

      else if (this.selectedAvailability === 'outOfStock') {

        matchesAvailability =
          Number(product.stock) <= 0;

      }


      return (
        matchesCategory &&
        matchesSearch &&
        matchesPrice &&
        matchesAvailability
      );

    });


    /* SORT */

    if (this.selectedSort === 'lowToHigh') {

      result.sort(
        (a, b) =>
          Number(a.price) - Number(b.price)
      );

    }

    else if (this.selectedSort === 'highToLow') {

      result.sort(
        (a, b) =>
          Number(b.price) - Number(a.price)
      );

    }

    else if (this.selectedSort === 'nameAsc') {

      result.sort(
        (a, b) =>
          String(a.name || '').localeCompare(
            String(b.name || '')
          )
      );

    }


    this.filteredProducts = [...result];

    console.log(
      'FILTERED SHOP PRODUCTS:',
      this.filteredProducts
    );

  }

  /* =========================================================
     FILTER RESET
  ========================================================= */

  clearFilters(): void {

    this.selectedCategory = 'All';
    this.selectedPrice = '';
    this.selectedAvailability = 'all';
    this.selectedSort = 'latest';
    this.searchTerm = '';

    this.filterProducts();
  }

  /* =========================================================
     CATEGORY DATA
  ========================================================= */

  get categories(): string[] {

    const values = this.products
      .map(product => product.category)
      .filter(Boolean);

    return [
      'All',
      ...Array.from(new Set(values))
    ];
  }

  /* =========================================================
     PRODUCT HELPERS
  ========================================================= */

  getProductId(product: Product): string {

    return String(
      product._id ||
      product.id ||
      ''
    );
  }


  
  getProductDiscount(product: Product): number {

    if (product.discount && product.discount > 0) {
      return Math.round(Number(product.discount));
    }

    if (
      product.originalPrice &&
      Number(product.originalPrice) > Number(product.price)
    ) {

      const discount =
        (
          (Number(product.originalPrice) -
            Number(product.price)) /
          Number(product.originalPrice)
        ) * 100;

      return Math.round(discount);
    }

    return 0;
  }

  formatPrice(value: number | undefined): string {

    return Number(value || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  getProductColors(product: Product): string[] {

    if (
      Array.isArray(product.colors) &&
      product.colors.length
    ) {
      return product.colors.slice(0, 5);
    }

    if (product.availableColors) {

      return product.availableColors
        .split(',')
        .map(color => color.trim())
        .filter(Boolean)
        .slice(0, 5);
    }

    return [];
  }

  getProductSizes(product: Product): string[] {

    return Array.isArray(product.sizes)
      ? product.sizes.slice(0, 6)
      : [];
  }

  getColorValue(color: string): string {

    const value = color
      .toLowerCase()
      .trim();

    const colorMap: Record<string, string> = {
      black: '#111111',
      white: '#ffffff',
      grey: '#9ca3af',
      gray: '#9ca3af',
      red: '#dc2626',
      blue: '#2563eb',
      navy: '#172554',
      green: '#16a34a',
      olive: '#65723b',
      beige: '#d6c7a1',
      brown: '#795548',
      maroon: '#7f1d1d',
      purple: '#7c3aed',
      pink: '#ec4899',
      orange: '#f97316',
      yellow: '#eab308'
    };

    return colorMap[value] || color;
  }

  getImageUrl(
    image: string,
    width = 900
  ): string {

    if (!image) {
      return 'assets/no-image.png';
    }

    if (!image.includes('res.cloudinary.com')) {
      return image;
    }

    if (image.includes('/f_auto,q_auto')) {
      return image;
    }

    return image.replace(
      '/image/upload/',
      `/image/upload/f_auto,q_auto,w_${width}/`
    );
  }

  /* =========================================================
     CART
  ========================================================= */

  addToCart(product: Product): void {

    if (Number(product.stock) <= 0) {
      return;
    }

    this.cartService.addToCart(product);

    this.notificationService.show(
      `${product.name} added to cart`
    );
  }

  /* =========================================================
     WISHLIST
  ========================================================= */

  toggleWishlist(product: Product): void {

    const id = this.getProductId(product);

    if (!id) {
      return;
    }

    if (this.isWishlisted(id)) {

      this.wishlistService.removeFromWishlist(id);

    } else {

      this.wishlistService.addToWishlist(product);

    }
  }

  isWishlisted(id: string): boolean {

    return this.wishlistService.isInWishlist(id);
  }

  /* =========================================================
     QUICK VIEW
  ========================================================= */

  openQuickView(product: Product): void {

    this.selectedProduct = product;

    document.body.classList.add('shop-modal-open');
  }

  closeQuickView(): void {

    this.selectedProduct = null;

    document.body.classList.remove('shop-modal-open');
  }

}