import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart } from 'chart.js/auto';
import { ProductService } from '../../services/product';
import { Product } from '../../models/product';
import { ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})


export class Admin implements OnInit, AfterViewInit {

  @ViewChild('salesCanvas')
  salesCanvas!: ElementRef<HTMLCanvasElement>;

  searchTerm = '';
  currentPage = 1;
  showModal = false;
  itemsPerPage = 5;
  inventoryValue = 0;
  totalProducts = 0;
  totalStock = 0;
  totalCategories = 0;
  mostExpensiveProduct = '';
  selectedFile!: File;
  imagePreview = '';
  lowStockProducts: Product[] = [];
  availableColors = [
    'Black',
    'White',
    'Red',
    'Blue',
    'Green',
    'Grey',
    'Navy'
  ];



  products: Product[] = [];
  newProduct: Product = {
    name: '',
    price: 0,
    image: '',
    category: '',
    brand: '',
    description: '',
    fabric: '',
    type: '',
    sku: '',
    discount: 0,
    colors: [],
    sizes: [],
    status: 'Active',
    stock: 0,
    showOnHome: true
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

  ngAfterViewInit(): void {

    this.createSalesChart();



  }
  loadProducts() {
    this.productService.getProducts().subscribe({

      next: (response: any) => {

        const data: Product[] = response.products;

        this.products = data;

        this.totalProducts = data.length;
        this.totalStock = data.reduce(
          (sum, product) => sum + (product.stock ?? 0),
          0
        );
        this.lowStockProducts = data.filter(
          product => (product.stock ?? 0) <= 5
        );

        this.totalCategories = new Set(
          data.map((product: Product) => product.category)
        ).size;

        this.inventoryValue = data.reduce(
          (sum: number, product: Product) => sum + product.price,
          0
        );

        const expensive = data.reduce(
          (prev: Product, current: Product) =>
            prev.price > current.price ? prev : current
        );

        this.mostExpensiveProduct = expensive.name;

      },

      error: (err) => {
        console.error(err);
      }

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

    if (!this.isFormValid()) {

      alert('Please fill all fields correctly.');

      return;

    }
    console.log('Stock:', this.newProduct.stock);

    console.log('Type:', typeof this.newProduct.stock);
    const formData = new FormData();

    formData.append('name', this.newProduct.name);

    formData.append('price', this.newProduct.price.toString());

    formData.append('category', this.newProduct.category);

    formData.append('description', this.newProduct.description || '');

    formData.append('fabric', this.newProduct.fabric || '');

    formData.append('type', this.newProduct.type || '');
    console.log('Stock:', this.newProduct.stock);
    console.log('Type:', typeof this.newProduct.stock);

    formData.append('stock', String(this.newProduct.stock));

    formData.append('showOnHome', String(this.newProduct.showOnHome));

    formData.append('image', this.selectedFile);

    this.productService.addProduct(formData).subscribe(() => {

      this.loadProducts();

      this.closeModal();

      this.newProduct = {

        name: '',

        price: 0,

        image: '',

        category: '',

        description: '',

        fabric: '',

        type: '',

        stock: 0,

        showOnHome: true

      };

      this.imagePreview = '';

    });

  }


  editProduct(product: Product) {

    this.editing = true;
    this.showModal = true;

    this.newProduct = { ...product };
    this.imagePreview =
      'http://localhost:8000/uploads/' + product.image;

  }

  updateProduct() {
    

    if (!this.isFormValid()) {

      alert('Please fill all fields correctly.');

      return;
    }


    this.showModal = false;
    this.productService.updateProduct(
      this.newProduct._id!,
      this.newProduct
    ).subscribe(() => {

      this.loadProducts();

      this.editing = false;

      this.newProduct = {
        _id: '',
        name: '',
        price: 0,
        image: '',
        category: ''
      };

    });

  }


  deleteProduct(id: string) {

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

  get pages(): number[] {

    return Array.from(

      { length: this.totalPages },

      (_, i) => i + 1

    );

  }

  goToPage(page: number) {

    this.currentPage = page;

  }
  isFormValid(): boolean {

    return !!(

      this.newProduct.name.trim() &&
      this.newProduct.price > 0 &&
      this.newProduct.category.trim() &&
      (
        this.selectedFile ||
        this.editing
      )

    );

  }
  openAddModal() {

    this.editing = false;

    this.showModal = true;

    this.newProduct = {
      name: '',

      price: 0,

      image: '',

      category: '',

      description: '',

      fabric: '',

      type: '',

      stock: 0,

      showOnHome: true
    };

  }
  closeModal() {

    this.showModal = false;

  }

  toggleColor(color: string) {

    if (!this.newProduct.colors) {
      this.newProduct.colors = [];
    }

    const index = this.newProduct.colors.indexOf(color);

    if (index > -1) {

      this.newProduct.colors.splice(index, 1);

    } else {

      this.newProduct.colors.push(color);

    }

  }

  onFileSelected(event: any) {

    if (event.target.files.length > 0) {

      this.selectedFile = event.target.files[0];

      const reader = new FileReader();

      reader.onload = () => {

        this.imagePreview = reader.result as string;

      };

      reader.readAsDataURL(this.selectedFile);

    }

  }

  createSalesChart() {

    new Chart(this.salesCanvas.nativeElement, {

      type: 'line',

      data: {

        labels: [

          'Jan',

          'Feb',

          'Mar',

          'Apr',

          'May',

          'Jun'

        ],

        datasets: [

          {

            label: 'Sales',

            data: [

              12000,

              19000,

              15000,

              25000,

              21000,

              30000

            ],

            borderColor: '#7C3AED',

            backgroundColor: 'rgba(124,58,237,0.15)',

            fill: true,

            tension: 0.4

          }

        ]

      },

      options: {

        responsive: true,

        maintainAspectRatio: false

      }

    });



  }

}