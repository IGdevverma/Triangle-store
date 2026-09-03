import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart } from 'chart.js/auto';
import { ProductService } from '../../services/product';
import { Product } from '../../models/product';
import { ViewChild, ElementRef } from '@angular/core';
import { OrderService } from '../../services/order';
import { OrderStatus } from '../../models/orders';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AdminService } from '../../services/admin';
import { UserService } from '../../services/user';
import { QuoteService } from '../../services/quote';
import { Quotes } from '../quotes/quotes';
import { InvoiceService } from '../../services/invoice.service';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { NgxSpinnerService } from 'ngx-spinner';


@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, Quotes],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})


export class Admin implements OnInit, AfterViewInit {

  packOnePrice: number = 0;
  packOneOriginalPrice: number = 0;
  packOneDiscount: number = 0;

  packThreePrice: number = 0;
  packThreeOriginalPrice: number = 0;
  packThreeDiscount: number = 0;
  i: any;
  changeRole(user: any, role: string) {

    this.userService.updateRole(user._id, role).subscribe({

      next: (response: any) => {

        this.toastr.success(
          response.message,
          'Success'
        );

        user.role = role;

      },

      error: (err) => {

        console.error(err);


        this.toastr.error(
          err.error?.message || 'Failed to update role',
          'Error'
        );


      }

    });

  }

  @ViewChild('salesCanvas')
  salesCanvas!: ElementRef<HTMLCanvasElement>;
  dashboardData = {
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
    totalCategories: 0,
    totalStock: 0,
    inventoryValue: 0,
    lowStockProducts: 0,
    processingOrders: 0,
    packedOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    monthlySales: [] as any[]
  };
  customers: any[] = [];
  today = new Date();
  filteredCustomers: any[] = [];

  selectedQuote: any = null;

  showQuoteModal = false;

  loadingQuote = false;
  galleryFiles: File[] = [];
  galleryPreviews: string[] = [];
  customerSearch = '';
  salesChart: any;
  searchTerm = '';
  newSize: string = '';

  currentPage = 1;
  showModal = false;
  activeMenu: string = 'dashboard';
  itemsPerPage = 5;
  selectedStock = 'All';
  selectedSort = 'Newest';
  inventoryValue = 0;
  totalProducts = 0;
  totalStock = 0;
  totalCategories = 0;
  mostExpensiveProduct = '';
  selectedFiles: File[] = [];
  imagePreviews: string[] = [];
  // Existing images already saved in Cloudinary
  existingImages: string[] = [];
  removedImages: string[] = [];


  // Existing images that user wants to delete

  lowStockProducts: Product[] = [];
  orders: any[] = [];
  quotes: any[] = [];


  filteredQuotes: any[] = [];

  quoteSearch = '';
  availableSizes: string[] = ['S', 'M', 'L', 'XL'];
  availableColors = [
    'Black',
    'White',
    'Red',
    'Blue',
    'Green',
    'Grey',
    'Navy'
  ];
  selectedSizes: string[] = [];
  selectedColors: string[] = [];






  products: Product[] = [];
  newProduct: Product = {
    name: '',
    price: 0,
    image: '',
    category: '',
    brand: '',
    originalPrice: 0,
    description: '',
    fabric: '',
    type: '',
    sku: '',
    discount: 0,
    colors: [],
    sizes: [],
    status: 'Active',
    stock: 0,
    showOnHome: true,
    availableColors: '',
    packs: [],
    colorCombinations: [],

  };
  get totalPages(): number {

    let filtered = this.products.filter(product =>
      product.name
        .toLowerCase()
        .includes(this.searchTerm.toLowerCase())
    );

    if (this.selectedStock === 'In Stock') {
      filtered = filtered.filter(
        product => (product.stock ?? 0) > 0
      );
    }

    if (this.selectedStock === 'Out of Stock') {
      filtered = filtered.filter(
        product => (product.stock ?? 0) === 0
      );
    }

    if (this.selectedStock === 'Low Stock') {
      filtered = filtered.filter(
        product => (product.stock ?? 0) <= 5
      );
    }

    return Math.max(
      1,
      Math.ceil(filtered.length / this.itemsPerPage)
    );
  }

  constructor(

    private productService: ProductService,
    private orderService: OrderService,
    private adminService: AdminService,
    private userService: UserService,
    private quoteService: QuoteService,
    private invoiceService: InvoiceService,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService

  ) { }
  ngOnInit(): void {

    this.loadProducts();
    this.loadOrders();
    this.loadDashboard();
    this.loadCustomers();
    this.loadQuotes();

  }

  ngAfterViewInit(): void {

    this.createSalesChart();



  }
  loadProducts() {

    this.productService.getProducts().subscribe({

      next: (response: any) => {

        console.log('PRODUCTS FROM API:', response);
        console.log('FIRST PRODUCT:', response.products?.[0]);
        console.log('FIRST PRODUCT PACKS:', response.products?.[0]?.packs);

        const data: Product[] = response.products;

        this.products = data;

        // Total Products
        this.totalProducts = data.length;

        // Total Stock
        this.totalStock = data.reduce(
          (sum, product) => sum + (product.stock ?? 0),
          0
        );

        // Low Stock Products
        this.lowStockProducts = data.filter(
          product => (product.stock ?? 0) <= 5
        );

        // Total Categories
        this.totalCategories = new Set(
          data.map((product: Product) => product.category)
        ).size;

        // Inventory Value
        this.inventoryValue = data.reduce(
          (sum: number, product: Product) =>
            sum + (product.price * (product.stock ?? 0)),
          0
        );

        // Most Expensive Product
        if (data.length > 0) {

          const expensive = data.reduce(
            (prev: Product, current: Product) =>
              prev.price > current.price ? prev : current
          );

          this.mostExpensiveProduct = expensive.name;

        } else {

          this.mostExpensiveProduct = '';

        }

      },

      error: (err) => {

        console.error('Failed to load products:', err);

      }

    });

  }

  onMainImageSelected(event: Event): void {

    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    if (!file.type.startsWith('image/')) {
      alert('Please select an image.');
      return;
    }

    // Main image first
    this.selectedFiles.unshift(file);

    const reader = new FileReader();

    reader.onload = () => {

      this.imagePreviews.unshift(
        reader.result as string
      );

    };

    reader.readAsDataURL(file);
  }
  loadOrders() {

    this.orderService.getOrders().subscribe({

      next: (response: any) => {

        this.orders = response.orders;



      },

      error: (err) => {

        console.error(err);

      }

    });

  }

  loadDashboard() {

    this.adminService.getDashboard().subscribe({

      next: (response: any) => {

        this.dashboardData = response.dashboard;

        console.log(this.dashboardData);
        this.createSalesChart();

      },

      error: (err) => {

        console.error(err);

      }

    });

  }
  loadCustomers() {

    this.userService.getUsers().subscribe({

      next: (response: any) => {

        this.customers = response.users;

        this.filteredCustomers = response.users;



      },

      error: (err) => {

        console.error(err);

      }

    });

  }


  loadQuotes() {

    this.quoteService.getQuotes().subscribe({

      next: (response: any) => {

        this.quotes = response.quotes;

        this.filteredQuotes = response.quotes;

      },

      error: (err) => {

        console.error(err);

      }

    });

  }

  filterCustomers() {

    const search = this.customerSearch.toLowerCase();

    this.filteredCustomers = this.customers.filter((user: any) =>

      user.name.toLowerCase().includes(search) ||

      user.email.toLowerCase().includes(search) ||

      (user.phone || '').toLowerCase().includes(search)

    );

  }

  deleteCustomer(id: string) {

    if (!confirm('Are you sure you want to delete this customer?')) {
      return;
    }

    this.userService.deleteUser(id).subscribe({

      next: (response: any) => {

        this.toastr.success(
          'Customer deleted successfully.',
          'Deleted'
        );
        this.loadCustomers();

      },

      error: (err) => {

        console.error(err);

        this.toastr.error(
          err.error?.message || 'Failed to delete customer',
          'Error'
        );

      }

    });

  }


  changeOrderStatus(
    order: any,
    status: OrderStatus
  ): void {

    if (!order?._id) {
      this.toastr.error(
        'Invalid order.',
        'Error'
      );
      return;
    }

    if (!status) {
      this.toastr.warning(
        'Please select a valid order status.',
        'Invalid Status'
      );
      return;
    }

    const previousStatus =
      order.orderStatus;

    // Optimistic UI update avoid karna hai.
    // Backend successful hone ke baad hi status change hoga.
    this.orderService
      .updateOrderStatus(
        order._id,
        status
      )
      .subscribe({

        next: (response) => {

          order.orderStatus = status;

          this.toastr.success(
            response?.message ||
            'Order status updated successfully.',
            'Updated'
          );

        },

        error: (error) => {

          // Restore previous status
          order.orderStatus =
            previousStatus;

          console.error(
            'Order status update failed:',
            error
          );

          this.toastr.error(
            error?.error?.message ||
            'Failed to update order status.',
            'Error'
          );

        }

      });

  }

  get filteredProducts() {

    let filtered = this.products.filter(product =>
      product.name
        .toLowerCase()
        .includes(this.searchTerm.toLowerCase())
    );

    // Stock Filter
    if (this.selectedStock === 'In Stock') {
      filtered = filtered.filter(product => (product.stock ?? 0) > 0);
    }

    if (this.selectedStock === 'Out of Stock') {
      filtered = filtered.filter(product => (product.stock ?? 0) === 0);
    }

    if (this.selectedStock === 'Low Stock') {
      filtered = filtered.filter(product => (product.stock ?? 0) <= 5);
    }

    // Sorting
    switch (this.selectedSort) {

      case 'Price Low → High':
        filtered.sort((a, b) => a.price - b.price);
        break;

      case 'Price High → Low':
        filtered.sort((a, b) => b.price - a.price);
        break;

      case 'Name A → Z':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;

      case 'Stock Highest':
        filtered.sort((a, b) => (b.stock ?? 0) - (a.stock ?? 0));
        break;

    }

    const start = (this.currentPage - 1) * this.itemsPerPage;

    return filtered.slice(
      start,
      start + this.itemsPerPage
    );

  }




  editing = false;

  onProductImagesSelected(event: Event): void {

    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const files = Array.from(input.files);

    // Maximum 5 images
    if (this.selectedFiles.length + files.length > 5) {
      this.toastr.warning(
        'You can upload maximum 5 images.',
        'Image Limit'
      );
      return;
    }

    files.forEach((file) => {

      // Validate image
      if (!file.type.startsWith('image/')) {
        this.toastr.warning(
          `${file.name} is not a valid image.`,
          'Invalid File'
        );
        return;
      }

      // Maximum 5MB
      if (file.size > 5 * 1024 * 1024) {
        this.toastr.warning(
          `${file.name} is larger than 5MB.`,
          'File Too Large'
        );
        return;
      }

      // Store file
      this.selectedFiles.push(file);

      // Create preview
      const reader = new FileReader();

      reader.onload = () => {

        this.imagePreviews.push(
          reader.result as string
        );

      };

      reader.readAsDataURL(file);

    });

    // Reset input so same file can be selected again
    input.value = '';

  }


  onProductFilterChange(): void {
    this.currentPage = 1;
  }

  removeProductImage(index: number): void {

    this.selectedFiles.splice(index, 1);

    this.imagePreviews.splice(index, 1);

  }

  addProduct() {




    if (!this.isFormValid()) {

      alert('Please fill all fields correctly.');

      return;

    }



    const formData = new FormData();

    // ==========================================
    // PACK OPTIONS
    // ==========================================
    const packs = [
      {
        id: 'single',
        name: '1 Vest',
        quantity: 1,
        price: this.packOnePrice,
        originalPrice: this.packOneOriginalPrice,
        discount: this.packOneDiscount
      },
      {
        id: 'pack-3',
        name: '3 Pack',
        quantity: 3,
        price: this.packThreePrice,
        originalPrice: this.packThreeOriginalPrice,
        discount: this.packThreeDiscount
      }
    ];

    formData.append(
      'packs',
      JSON.stringify(packs)
    );
    formData.append('name', this.newProduct.name);

    formData.append('price', this.newProduct.price.toString());

    formData.append('category', this.newProduct.category);

    formData.append('description', this.newProduct.description || '');

    formData.append('fabric', this.newProduct.fabric || '');

    formData.append('type', this.newProduct.type || '');
    formData.append(
      'availableColors',
      this.newProduct.availableColors || ''
    );

    // ==========================================
    // COLORS
    // ==========================================

    const colors = (this.newProduct.availableColors || '')
      .split(',')
      .map((color: string) => color.trim())
      .filter((color: string) =>
        color && color.toLowerCase() !== 'undefined'
      );






    // ==========================================
    // SIZES
    // ==========================================

    const sizes = (this.newProduct.sizes || [])
      .flatMap((size: string) => size.split(','))
      .map((size: string) => size.trim())
      .filter((size: string) => size);


    console.log('SIZES BEING SENT:', sizes);
    console.log('COLORS BEING SENT:', colors);


    // ==========================================
    // SEND COLORS + SIZES
    // ==========================================

    formData.append(
      'colors',
      JSON.stringify(colors)
    );

    formData.append(
      'sizes',
      JSON.stringify(sizes)
    );

    formData.append('stock', String(this.newProduct.stock));

    formData.append('showOnHome', String(this.newProduct.showOnHome));

    this.selectedFiles.forEach((file) => {

      formData.append('images', file);

    });


    formData.append(
      'removedImages',
      JSON.stringify(this.removedImages)
    );






    this.productService.addProduct(formData).subscribe({


      next: (res) => {



        this.toastr.success(
          'Product added successfully.',
          'Success'
        );
        this.currentPage = 1;

        this.closeModal();

        this.loadProducts();

      },

      error: (err) => {

        this.toastr.error(
          err.error?.message || 'Something went wrong.',
          'Error'
        );
      }

    });



  }



  editProduct(product: Product): void {

    console.log('========== EDIT PRODUCT ==========');
    console.log('PRODUCT:', product);
    console.log('PACKS:', product.packs);

    this.editing = true;
    this.showModal = true;

    // ==========================================
    // COLORS
    // ==========================================

    const colors = Array.isArray(product.colors)
      ? product.colors
        .flatMap((color: string) => color.split(','))
        .map((color: string) => color.trim())
        .filter(
          (color: string) =>
            color && color.toLowerCase() !== 'undefined'
        )
      : [];

    // ==========================================
    // SIZES
    // ==========================================

    const sizes = Array.isArray(product.sizes)
      ? product.sizes
        .flatMap((size: string) => size.split(','))
        .map((size: string) => size.trim())
        .filter((size: string) => size)
      : [];

    // ==========================================
    // PRODUCT DATA
    // ==========================================

    this.newProduct = {
      ...product,

      colors: colors,
      sizes: sizes,

      availableColors: colors.join(', ')
    };

    // ==========================================
    // PACK OPTIONS
    // ==========================================

    const packs = Array.isArray(product.packs)
      ? product.packs
      : [];

    const singlePack = packs.find(
      pack => pack.id === 'single'
    );

    const threePack = packs.find(
      pack => pack.id === 'pack-3'
    );

    console.log('SINGLE PACK:', singlePack);
    console.log('THREE PACK:', threePack);

    // ==========================================
    // 1 VEST
    // ==========================================

    this.packOnePrice =
      Number(singlePack?.price ?? 0);

    this.packOneOriginalPrice =
      Number(singlePack?.originalPrice ?? 0);

    this.packOneDiscount =
      Number(singlePack?.discount ?? 0);

    // ==========================================
    // 3 PACK
    // ==========================================

    this.packThreePrice =
      Number(threePack?.price ?? 0);

    this.packThreeOriginalPrice =
      Number(threePack?.originalPrice ?? 0);

    this.packThreeDiscount =
      Number(threePack?.discount ?? 0);

    // ==========================================
    // IMAGES
    // ==========================================

    this.selectedFiles = [];
    this.removedImages = [];

    this.existingImages = product.images?.length
      ? [...product.images]
      : product.image
        ? [product.image]
        : [];

    this.imagePreviews = [...this.existingImages];

    console.log('EDIT DATA:', {
      colors: this.newProduct.colors,
      sizes: this.newProduct.sizes,
      packOnePrice: this.packOnePrice,
      packOneOriginalPrice: this.packOneOriginalPrice,
      packOneDiscount: this.packOneDiscount,
      packThreePrice: this.packThreePrice,
      packThreeOriginalPrice: this.packThreeOriginalPrice,
      packThreeDiscount: this.packThreeDiscount
    });
  }
  updateProduct() {

    if (!this.isFormValid()) {

      this.toastr.warning(
        'Please fill all fields correctly.',
        'Validation'
      );

      return;
    }

    const formData = new FormData();


    // ==========================================
    // PACK OPTIONS
    // ==========================================

    const packs = [
      {
        id: 'single',
        name: '1 Vest',
        quantity: 1,
        price: Number(this.packOnePrice) || 0,
        originalPrice: Number(this.packOneOriginalPrice) || 0,
        discount: Number(this.packOneDiscount) || 0
      },
      {
        id: 'pack-3',
        name: '3 Pack',
        quantity: 3,
        price: Number(this.packThreePrice) || 0,
        originalPrice: Number(this.packThreeOriginalPrice) || 0,
        discount: Number(this.packThreeDiscount) || 0
      }
    ];


    formData.append(
      'packs',
      JSON.stringify(packs)
    );
    console.log('PACKS BEING SENT:', packs);

    formData.append('name', this.newProduct.name || '');
    formData.append('price', String(this.newProduct.price || 0));
    formData.append('category', this.newProduct.category || '');
    formData.append('stock', String(this.newProduct.stock || 0));
    formData.append('description', this.newProduct.description || '');
    formData.append('fabric', this.newProduct.fabric || '');
    formData.append('type', this.newProduct.type || '');



    const colors = (this.newProduct.availableColors || '')
      .split(',')
      .map((color: string) => color.trim())
      .filter((color: string) =>
        color && color.toLowerCase() !== 'undefined'
      );

    console.log('COLORS BEING SENT:', colors);

    formData.append(
      'colors',
      JSON.stringify(colors)
    );

    const sizes = (this.newProduct.sizes || [])
      .flatMap((size: string) => size.split(','))
      .map((size: string) => size.trim())
      .filter((size: string) => size);
    console.log('SIZES BEING SENT:', sizes);


    formData.append(
      'sizes',
      JSON.stringify(sizes)
    );


    formData.append(
      'showOnHome',
      String(this.newProduct.showOnHome ?? true)
    );

    formData.append(
      'discount',
      String(this.newProduct.discount || 0)
    );

    formData.append(
      'sku',
      this.newProduct.sku || ''
    );
    formData.append(
      'existingImages',
      JSON.stringify(
        this.imagePreviews.filter(image =>
          image.startsWith('http')
        )
      )
    );


    // Main image
    if (this.imagePreviews.length > 0) {

      const mainImage = this.imagePreviews[0];

      if (mainImage.startsWith('http')) {

        formData.append(
          'mainImage',
          mainImage
        );

      }

    }
    // IMPORTANT: only append image when user selected a new file
    if (this.selectedFiles.length > 0) {

      this.selectedFiles.forEach((file) => {

        formData.append('images', file);

      });

    }

    this.productService.updateProduct(
      this.newProduct._id!,
      formData
    ).subscribe({

      next: () => {

        this.showModal = false;

        this.loadProducts();

        this.editing = false;

        this.selectedFiles = [];

        this.imagePreviews = [];

        this.newProduct = {
          name: '',
          price: 0,
          image: '',
          category: '',
          brand: '',
          originalPrice: 0,
          description: '',
          fabric: '',
          type: '',
          sku: '',
          discount: 0,
          colors: [],
          sizes: [],
          status: 'Active',
          stock: 0,
          showOnHome: true,
          availableColors: ''
        };

        this.toastr.success(
          'Product updated successfully.',
          'Success'
        );

      },

      error: (err) => {

        console.error(
          'Update product error:',
          err
        );

        this.toastr.error(
          'Failed to update product.',
          'Error'
        );

      }

    });

  }


  deleteProduct(id: string) {

    Swal.fire({

      title: 'Delete Product?',

      text: 'This action cannot be undone.',

      icon: 'warning',

      showCancelButton: true,

      confirmButtonColor: '#DC2626',

      cancelButtonColor: '#6B7280',

      confirmButtonText: 'Delete',

      cancelButtonText: 'Cancel'

    }).then((result) => {

      if (result.isConfirmed) {

        this.spinner.show();

        this.productService.deleteProduct(id).subscribe({

          next: () => {

            this.spinner.hide();

            this.loadProducts();

            this.toastr.success(

              'Product deleted successfully.',

              'Deleted'

            );

          },

          error: () => {

            this.spinner.hide();

            this.toastr.error(



              'Failed to delete product.',

              'Error'

            );

          }

        });

      }

    });

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

    const basicFieldsValid =
      !!this.newProduct.name?.trim() &&
      this.newProduct.price > 0 &&
      !!this.newProduct.category?.trim();

    if (this.editing) {
      return basicFieldsValid;
    }

    return (
      basicFieldsValid &&
      this.selectedFiles.length > 0
    );
  }
  openAddModal() {

    this.editing = false;
    this.showModal = true;
    this.packOnePrice = 0;
    this.packOneOriginalPrice = 0;
    this.packOneDiscount = 0;

    this.packThreePrice = 0;
    this.packThreeOriginalPrice = 0;
    this.packThreeDiscount = 0;

    this.selectedFiles = [];
    this.imagePreviews = [];
    this.existingImages = [];
    this.removedImages = [];
    this.newSize = '';


    this.newProduct = {

      name: '',

      price: 0,

      image: '',

      category: '',

      brand: '',

      originalPrice: 0,

      description: '',

      fabric: '',

      type: '',

      sku: '',

      discount: 0,

      colors: [],

      sizes: [],

      status: 'Active',

      stock: 0,

      showOnHome: true,

      availableColors: ''

    };

  }


  closeModal() {


    this.showModal = false;

    this.packOnePrice = 0;
    this.packOneOriginalPrice = 0;
    this.packOneDiscount = 0;

    this.packThreePrice = 0;
    this.packThreeOriginalPrice = 0;
    this.packThreeDiscount = 0;

    this.selectedFiles = [];
    this.imagePreviews = [];

    this.existingImages = [];
    this.removedImages = [];

    this.newSize = '';

    this.newProduct = {
      name: '',
      price: 0,
      originalPrice: 0,
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
      showOnHome: true,
      availableColors: ''
    };

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

  onFilesSelected(event: Event): void {

    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const files = Array.from(input.files);

    // Maximum 5 images
    if (files.length > 5) {

      this.toastr.warning(
        'You can upload maximum 5 images.',
        'Image Limit'
      );

      return;
    }

    // Reset previous selection
    this.selectedFiles = [];
    this.imagePreviews = [];

    files.forEach((file) => {

      // 5MB validation
      if (file.size > 5 * 1024 * 1024) {

        this.toastr.warning(
          `${file.name} is larger than 5MB.`,
          'File Too Large'
        );

        return;
      }

      this.selectedFiles.push(file);

      const reader = new FileReader();

      reader.onload = () => {

        this.imagePreviews.push(
          reader.result as string
        );

      };

      reader.readAsDataURL(file);

    });

  }



  createSalesChart(): void {

    if (!this.salesCanvas?.nativeElement) {
      return;
    }

    if (this.salesChart) {
      this.salesChart.destroy();
    }

    const months = [
      'Jan', 'Feb', 'Mar', 'Apr',
      'May', 'Jun', 'Jul', 'Aug',
      'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const labels =
      (this.dashboardData.monthlySales || []).map(
        (item: any) =>
          months[(item?._id?.month ?? 1) - 1]
      );

    const revenue =
      (this.dashboardData.monthlySales || []).map(
        (item: any) => item?.revenue ?? 0
      );

    this.salesChart = new Chart(
      this.salesCanvas.nativeElement,
      {
        type: 'line',

        data: {
          labels,

          datasets: [
            {
              label: 'Monthly Revenue',
              data: revenue,

              borderColor: '#7C3AED',

              backgroundColor:
                'rgba(124,58,237,0.15)',

              fill: true,

              tension: 0.4
            }
          ]
        },

        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      }
    );
  }

  downloadInvoice(order: any): void {
    this.invoiceService.generateInvoice(order);
  }

  onGalleryFilesSelected(event: Event): void {

    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const selectedFiles = Array.from(input.files);

    // Maximum 5 images
    if (selectedFiles.length > 5) {

      alert('You can upload maximum 5 images.');

      return;
    }

    // Validate files
    const invalidFile = selectedFiles.find(file =>
      !file.type.startsWith('image/')
    );

    if (invalidFile) {

      alert('Please select only image files.');

      return;
    }

    // Validate size - 5MB each
    const largeFile = selectedFiles.find(file =>
      file.size > 5 * 1024 * 1024
    );

    if (largeFile) {

      alert('Each image must be less than 5MB.');

      return;
    }





    this.imagePreviews = [];

    selectedFiles.forEach(file => {

      const reader = new FileReader();

      reader.onload = () => {

        this.imagePreviews.push(
          reader.result as string
        );

      };

      reader.readAsDataURL(file);

    });

  }

  removeGalleryImage(index: number): void {

    const image = this.imagePreviews[index];

    if (!image) {
      return;
    }

    // Check if this image already exists in Cloudinary
    const isExistingImage =
      this.existingImages.includes(image);

    if (isExistingImage) {

      // Existing image ko delete list mein daalo
      this.removedImages.push(image);

      // Existing images list se hatao
      this.existingImages =
        this.existingImages.filter(
          img => img !== image
        );

    } else {

      // Ye NEW image hai jo abhi computer se select hui hai

      const newFileIndex =
        this.imagePreviews
          .slice(0, index)
          .filter(
            img => !this.existingImages.includes(img)
          )
          .length;

      this.selectedFiles.splice(
        newFileIndex,
        1
      );
    }

    // Screen se image remove karo
    this.imagePreviews.splice(index, 1);

  }

  onGalleryImagesSelected(event: Event): void {

    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const files = Array.from(input.files);

    // Maximum 5 total images
    if (this.imagePreviews.length + files.length > 5) {
      alert('You can upload maximum 5 product images.');
      input.value = '';
      return;
    }

    files.forEach((file) => {

      if (!file.type.startsWith('image/')) {
        return;
      }

      // IMPORTANT
      // Actual file ko save karo
      this.selectedFiles.push(file);

      const reader = new FileReader();

      reader.onload = () => {

        this.imagePreviews.push(
          reader.result as string
        );

      };

      reader.readAsDataURL(file);

    });

    input.value = '';
  }


  removeImage(index: number): void {

    const image = this.imagePreviews[index];

    if (!image) {
      return;
    }

    // Existing Cloudinary image
    if (image.startsWith('http')) {

      this.removedImages.push(image);

    }
    // Newly selected local image
    else {

      const localFileIndex = this.imagePreviews
        .slice(0, index)
        .filter(img => !img.startsWith('http'))
        .length;

      this.selectedFiles.splice(localFileIndex, 1);
    }

    // Remove from UI
    this.imagePreviews.splice(index, 1);

  }

  toggleSize(size: string): void {

    if (this.selectedSizes.includes(size)) {

      this.selectedSizes =
        this.selectedSizes.filter(s => s !== size);

    } else {

      this.selectedSizes.push(size);

    }
  }

  getColorValue(color: string): string {

    const colorMap: { [key: string]: string } = {

      Black: '#000000',
      White: '#ffffff',
      Grey: '#808080',
      Red: '#dc2626',
      Blue: '#2563eb',
      Green: '#16a34a',
      Navy: '#0f172a',
      Beige: '#d6c3a5'

    };

    return colorMap[color] || '#e5e7eb';
  }


  addSize(): void {

    const size = this.newSize.trim().toUpperCase();

    if (!size) {
      return;
    }

    if (!this.newProduct.sizes) {
      this.newProduct.sizes = [];
    }

    if (this.newProduct.sizes.includes(size)) {
      return;
    }

    this.newProduct.sizes.push(size);

    this.newSize = '';
  }

  removeSize(index: number): void {

    if (!this.newProduct.sizes) {
      return;
    }

    this.newProduct.sizes.splice(index, 1);
  }


  setMainImage(index: number): void {

    if (index < 0 || index >= this.imagePreviews.length) {
      return;
    }

    const selectedImage =
      this.imagePreviews[index];

    this.imagePreviews.splice(index, 1);

    this.imagePreviews.unshift(selectedImage);

  }
}