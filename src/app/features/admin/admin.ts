import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ProductService } from '../../services/product';
import { Product } from '../../models/product';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class Admin implements OnInit {

  products: Product[] = [];
  newProduct: Product = {
    id: 0,
    name: '',
    price: 0,
    image: '',
    category: ''
  };

  constructor(
    private productService: ProductService
  ) { }

  ngOnInit(): void {

    this.loadProducts();

  }

  loadProducts() {

    this.productService.getProducts()
      .subscribe(data => {

        this.products = data;

      });

  }




  editing = false;

  addProduct() {

    this.productService.addProduct(this.newProduct)
      .subscribe(() => {

        this.loadProducts();

        this.newProduct = {
          id: 0,
          name: '',
          price: 0,
          image: '',
          category: ''
        };

      });

  }

  editProduct(product: Product) {

    this.editing = true;

    this.newProduct = { ...product };

  }

  updateProduct() {

    this.productService.updateProduct(
      this.newProduct.id,
      this.newProduct
    ).subscribe(() => {

      this.loadProducts();

      this.editing = false;

      this.newProduct = {
        id: 0,
        name: '',
        price: 0,
        image: '',
        category: ''
      };

    });

  }


  deleteProduct(id: number) {

    if (confirm('Delete this product?')) {

      this.productService.deleteProduct(id)
        .subscribe(() => {

          this.loadProducts();

        });

    }

  }

}