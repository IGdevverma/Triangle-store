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

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './shop.html',
  styleUrl: './shop.css'
})
export class Shop implements OnInit {

  products: Product[] = [];
  filteredProducts: Product[] = [];
  selectedCategory = 'All';
  selectedProduct: Product | null = null;
  selectedPrice = '';
  selectedSort = 'latest';
  searchTerm = '';

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private wishlistService: WishlistService,
    private notificationService: NotificationService,
    private loadingService: LoadingService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {

    this.loadingService.show();

    this.productService.getProducts().subscribe({

      next: (response: any) => {

        this.products = response.products;
        this.route.queryParams.subscribe(params => {

          this.searchTerm = params['search'] || '';

          this.filterProducts();

        });

        this.filteredProducts = response.products;

        this.filterProducts();

        this.loadingService.hide();

      },

      error: () => {

        this.loadingService.hide();

      }

    });

  }

  filterProducts() {

    this.filteredProducts = this.products.filter(product => {

      const matchesCategory =
        this.selectedCategory === 'All' ||
        product.category === this.selectedCategory;
      const keyword = this.searchTerm.toLowerCase();

      const matchesSearch =

        product.name.toLowerCase().includes(keyword) ||

        product.category.toLowerCase().includes(keyword) ||

        (product.description || '').toLowerCase().includes(keyword);

      let matchesPrice = true;

      if (this.selectedPrice === 'under1000') {

        matchesPrice = product.price < 1000;

      }

      else if (this.selectedPrice === '1000to3000') {

        matchesPrice =
          product.price >= 1000 &&
          product.price <= 3000;

      }

      else if (this.selectedPrice === 'above3000') {

        matchesPrice = product.price > 3000;

      }

      return (
        matchesCategory &&
        matchesPrice &&
        matchesSearch
      );
    });
    if (this.selectedSort === 'lowToHigh') {

      this.filteredProducts.sort(

        (a, b) => a.price - b.price

      );

    }

    else if (this.selectedSort === 'highToLow') {

      this.filteredProducts.sort(

        (a, b) => b.price - a.price

      );

    }

    else if (this.selectedSort === 'latest') {

      this.filteredProducts = [...this.filteredProducts];

    }

  }



  addToCart(product: Product) {

    this.cartService.addToCart(product);

    this.notificationService.show(
      product.name + ' added to cart'
    );

  }

  toggleWishlist(product: Product) {

    if (product.id && this.isWishlisted(product.id)) {

      this.wishlistService.removeFromWishlist(product.id);

    }

    else {

      this.wishlistService.addToWishlist(product);

    }

  }

  isWishlisted(id: string) {

    return this.wishlistService.isInWishlist(id);

  }
  openQuickView(product: Product) {

    this.selectedProduct = product;

  }

  closeQuickView() {

    this.selectedProduct = null;

  }

}