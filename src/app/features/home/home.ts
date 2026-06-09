import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../models/product';
import { ProductService } from '../../services/product';
import { CartService } from '../../services/cart';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {

  products: Product[] = [];
  searchTerm = '';

  selectedCategory = 'All';

  filteredProducts: Product[] = [];

  constructor(

    private productService: ProductService,

    private cartService: CartService

  ) { }

  ngOnInit(): void {

    this.productService.getProducts().subscribe({

      next: (data) => {

        this.products = data;
        this.filteredProducts = data;

      },

      error: (err) => {

        console.error('Error fetching products:', err);

      }

    });

  }

  addToCart(product: Product) {

    this.cartService.addToCart(product);

    alert(product.name + ' added to cart');

  }

  filterProducts() {

    this.filteredProducts = this.products.filter(product => {

      

      const matchesSearch =

        product.name.toLowerCase()

          .includes(this.searchTerm.toLowerCase());

      const matchesCategory =

        this.selectedCategory === 'All' ||

        product.category === this.selectedCategory;

      return matchesSearch && matchesCategory;

    });
       console.log(this.filteredProducts);
  }
 

}