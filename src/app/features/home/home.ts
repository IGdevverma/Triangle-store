import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../models/product';
import { ProductService } from '../../services/product';
import { CartService } from '../../services/cart';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {

  products: Product[] = [];

  constructor(

    private productService: ProductService,

    private cartService: CartService

  ) { }

  ngOnInit(): void {

    this.productService.getProducts().subscribe({

      next: (data) => {

        this.products = data;

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




}