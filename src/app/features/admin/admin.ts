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

  searchTerm = '';
  currentPage = 1;

  itemsPerPage = 5;

  totalProducts = 0;
  totalCategories = 0;

  products: Product[] = [];
  newProduct: Product = {
    id: 0,
    name: '',
    price: 0,
    image: '',
    category: ''
  };
  get totalPages(): number {

    return Math.ceil(

      this.products.filter(product =>

        product.name
          .toLowerCase()
          .includes(this.searchTerm.toLowerCase())

      ).length / this.itemsPerPage

    );

  }

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

        this.totalProducts = data.length;

        this.totalCategories =
          new Set(
            data.map(product => product.category)
          ).size;

      });

  }

  get filteredProducts() {

    const filtered = this.products.filter(product =>

      product.name
        .toLowerCase()
        .includes(this.searchTerm.toLowerCase())

    );

    const start =
      (this.currentPage - 1) * this.itemsPerPage;

    return filtered.slice(
      start,
      start + this.itemsPerPage
    );

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

  previousPage() {

    if (this.currentPage > 1) {

      this.currentPage--;

    }

  }
  nextPage() {

    if (this.currentPage < this.totalPages) {

      this.currentPage++;

    }

  }

}