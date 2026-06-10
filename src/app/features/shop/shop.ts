import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Product } from '../../models/product';
import { ProductService } from '../../services/product';
import { CartService } from '../../services/cart';
import { WishlistService } from '../../services/wishlist';

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

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private wishlistService: WishlistService
  ) { }

  ngOnInit(): void {

    this.productService.getProducts().subscribe(data => {

      this.products = data;
      this.filteredProducts = data;
      this.filterProducts();



    });

  }

  filterProducts() {

    this.filteredProducts = this.products.filter(product => {

      const matchesCategory =
        this.selectedCategory === 'All' ||
        product.category === this.selectedCategory;

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

      return matchesCategory && matchesPrice;

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

      this.filteredProducts.sort(

        (a, b) => b.id - a.id

      );

    }

  }



addToCart(product: Product) {

  this.cartService.addToCart(product);

  alert(product.name + ' added to cart');

}

toggleWishlist(product: Product) {

  if (this.isWishlisted(product.id)) {

    this.wishlistService.removeFromWishlist(product.id);

  }

  else {

    this.wishlistService.addToWishlist(product);

  }

}

isWishlisted(id: number) {

  return this.wishlistService.isInWishlist(id);

}
openQuickView(product: Product) {

  this.selectedProduct = product;

}

closeQuickView() {

  this.selectedProduct = null;

}

}