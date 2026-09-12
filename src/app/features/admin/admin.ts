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


  // ==========================================
  // GENERIC PACK BUILDER
  // ==========================================

  productPacks: any[] = [];

  colorCombinations: any[] = [];



  // ==========================================
  // PACK-WISE IMAGES
  // ==========================================

  singleVestFiles: File[] = [];
  singleVestPreviews: string[] = [];

  threePackFiles: File[] = [];
  threePackPreviews: string[] = [];
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
    // ==========================================
    // GENERIC PACK OPTIONS
    // ==========================================
    const packs = this.productPacks.map((pack: any) => ({
      id: pack.id,
      name: pack.name,
      quantity: Number(pack.quantity) || 1,
      price: Number(pack.price) || 0,
      originalPrice: Number(pack.originalPrice) || 0,
      discount: Number(pack.discount) || 0,
      colors: pack.colors || [],
      sizes: pack.sizes || [],

      // Number of photos selected for this pack
      imageCount: Array.isArray(pack.files)
        ? pack.files.length
        : 0
    }));


    // ==========================================
    // COLOR COMBINATIONS
    // ==========================================

    const combinations = this.colorCombinations.map(
      (combination: any) => {

        return {
          id: combination.id,

          name:
            combination.name?.trim() ||
            'Color Combination',

          colors:
            Array.isArray(combination.colors)
              ? combination.colors
              : [],

          // Number of photos selected
          imageCount:
            Array.isArray(combination.files)
              ? combination.files.length
              : 0
        };

      }
    );

    formData.append(
      'colorCombinations',
      JSON.stringify(combinations)
    );

    console.log(
      'COLOR COMBINATIONS BEING SENT:',
      combinations
    );

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


    // ==========================================
    // PACK IMAGES
    // ==========================================

    this.productPacks.forEach((pack: any) => {

      if (Array.isArray(pack.files)) {

        pack.files.forEach((file: File) => {

          formData.append('packImages', file);

        });

      }

    });


    // ==========================================
    // COLOR COMBINATION IMAGES
    // ==========================================

    this.colorCombinations.forEach((combination: any) => {

      if (Array.isArray(combination.files)) {

        combination.files.forEach((file: File) => {

          formData.append('combinationImages', file);

        });

      }

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
    console.log('COLOR COMBINATIONS:', product.colorCombinations);

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
            color &&
            color.toLowerCase() !== 'undefined'
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
    // GENERIC PACK BUILDER
    // ==========================================

    const packs = Array.isArray(product.packs)
      ? product.packs
      : [];

    this.productPacks = packs.map((pack: any) => {

      return {

        id:
          pack.id ||
          'pack-' + Date.now() + Math.random(),

        name:
          pack.name || '',

        quantity:
          Number(pack.quantity) || 1,

        price:
          Number(pack.price) || 0,

        originalPrice:
          Number(pack.originalPrice) || 0,

        discount:
          Number(pack.discount) || 0,

        colors:
          Array.isArray(pack.colors)
            ? [...pack.colors]
            : [],

        sizes:
          Array.isArray(pack.sizes)
            ? [...pack.sizes]
            : [],

        // Existing pack images
        existingImages:
          Array.isArray(pack.images)
            ? [...pack.images]
            : pack.image
              ? [pack.image]
              : [],

        // New files selected during editing
        files: [] as File[],

        // Preview existing images
        previews:
          Array.isArray(pack.images)
            ? [...pack.images]
            : pack.image
              ? [pack.image]
              : [],

        // Existing images removed during editing
        removedImages: [] as string[]

      };

    });

    // ==========================================
    // COLOR COMBINATIONS
    // ==========================================

    const combinations =
      Array.isArray(product.colorCombinations)
        ? product.colorCombinations
        : [];

    this.colorCombinations =
      combinations.map((combination: any) => {

        return {

          id:
            combination.id ||
            'combination-' +
            Date.now() +
            Math.random(),

          name:
            combination.name || '',

          colors:
            Array.isArray(combination.colors)
              ? [...combination.colors]
              : [],

          // Existing combination images
          existingImages:
            Array.isArray(combination.images)
              ? [...combination.images]
              : [],

          // New files selected during editing
          files: [] as File[],

          // Existing images as preview
          previews:
            Array.isArray(combination.images)
              ? [...combination.images]
              : [],

          // Existing images removed during editing
          removedImages: [] as string[]

        };

      });

    // ==========================================
    // PRODUCT IMAGES
    // ==========================================

    this.selectedFiles = [];
    this.removedImages = [];

    this.existingImages = product.images?.length
      ? [...product.images]
      : product.image
        ? [product.image]
        : [];

    this.imagePreviews = [
      ...this.existingImages
    ];

    // ==========================================
    // RESET OLD VEST-SPECIFIC DATA
    // ==========================================

    this.singleVestFiles = [];
    this.singleVestPreviews = [];

    this.threePackFiles = [];
    this.threePackPreviews = [];

    // ==========================================
    // RESET OLD PACK PRICE VARIABLES
    // ==========================================

    this.packOnePrice = 0;
    this.packOneOriginalPrice = 0;
    this.packOneDiscount = 0;

    this.packThreePrice = 0;
    this.packThreeOriginalPrice = 0;
    this.packThreeDiscount = 0;

    // ==========================================
    // LOG EDIT DATA
    // ==========================================

    console.log(
      'EDIT PRODUCT PACKS:',
      this.productPacks
    );

    console.log(
      'EDIT COLOR COMBINATIONS:',
      this.colorCombinations
    );

    console.log(
      'EDIT PRODUCT IMAGES:',
      this.imagePreviews
    );

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
    // GENERIC PACK OPTIONS
    // ==========================================
    const packs = this.productPacks.map((pack: any) => {

      const existingImages =
        Array.isArray(pack.existingImages)
          ? pack.existingImages
          : [];

      const newImageCount =
        Array.isArray(pack.files)
          ? pack.files.length
          : 0;

      return {
        id: pack.id,

        name:
          pack.name?.trim() || 'Pack',

        quantity:
          Number(pack.quantity) || 1,

        price:
          Number(pack.price) || 0,

        originalPrice:
          Number(pack.originalPrice) || 0,

        discount:
          Number(pack.discount) || 0,

        colors:
          Array.isArray(pack.colors)
            ? pack.colors
            : [],

        sizes:
          Array.isArray(pack.sizes)
            ? pack.sizes
            : [],

        // Existing pack images
        images: existingImages,

        image:
          existingImages[0] || '',

        // New images
        imageCount: newImageCount,

        // Images removed while editing
        removedImages:
          Array.isArray(pack.removedImages)
            ? pack.removedImages
            : []
      };



    });

    formData.append(
      'packs',
      JSON.stringify(packs)
    );

    // ==========================================
    // COLOR COMBINATIONS
    // ==========================================

    // ==========================================
    // COLOR COMBINATIONS
    // ==========================================

    const combinations =
      this.colorCombinations.map(
        (combination: any) => {

          const existingImages =
            Array.isArray(combination.existingImages)
              ? combination.existingImages
              : [];

          const newImageCount =
            Array.isArray(combination.files)
              ? combination.files.length
              : 0;

          return {

            id: combination.id,

            name:
              combination.name?.trim() ||
              'Color Combination',

            colors:
              Array.isArray(combination.colors)
                ? combination.colors
                : [],

            // Existing combination images
            images: existingImages,

            image:
              existingImages[0] || '',

            // New images selected during edit
            imageCount: newImageCount,

            // Existing images removed during edit
            removedImages:
              Array.isArray(combination.removedImages)
                ? combination.removedImages
                : []
          };

        }
      );

    formData.append(
      'colorCombinations',
      JSON.stringify(combinations)
    );

    console.log(
      'COLOR COMBINATIONS BEING SENT:',
      combinations
    );

    console.log(
      'GENERIC PACKS BEING SENT:',
      packs
    );

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
    // ==========================================
    // GENERIC PACK-WISE IMAGES
    // ==========================================

    this.productPacks.forEach((pack: any) => {

      if (Array.isArray(pack.files)) {

        pack.files.forEach((file: File) => {

          formData.append('packImages', file);

        });

      }

    });

    // ==========================================
    // COLOR COMBINATION IMAGES
    // ==========================================

    this.colorCombinations.forEach(
      (combination: any) => {

        if (Array.isArray(combination.files)) {

          combination.files.forEach(
            (file: File) => {

              formData.append(
                'combinationImages',
                file
              );

            }
          );

        }

      }
    );

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

    this.productPacks = [];
    this.colorCombinations = [];

  }


  closeModal() {

    this.productPacks = [];
    this.colorCombinations = [];
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


  // ==========================================
  // SINGLE VEST PACK IMAGES
  // ==========================================

  onSingleVestImagesSelected(event: Event): void {

    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const files = Array.from(input.files);

    // Maximum 5 images
    if (this.singleVestFiles.length + files.length > 5) {

      this.toastr.warning(
        'You can upload maximum 5 Single Vest photos.',
        'Image Limit'
      );

      input.value = '';
      return;
    }

    files.forEach((file) => {

      // Image validation
      if (!file.type.startsWith('image/')) {

        this.toastr.warning(
          `${file.name} is not a valid image.`,
          'Invalid File'
        );

        return;
      }

      // 5MB validation
      if (file.size > 5 * 1024 * 1024) {

        this.toastr.warning(
          `${file.name} is larger than 5MB.`,
          'File Too Large'
        );

        return;
      }

      // Save actual file
      this.singleVestFiles.push(file);

      // Create preview
      const reader = new FileReader();

      reader.onload = () => {

        this.singleVestPreviews.push(
          reader.result as string
        );

      };

      reader.readAsDataURL(file);

    });

    // Allow same file to be selected again
    input.value = '';

  }


  removeSingleVestImage(index: number): void {

    if (
      index < 0 ||
      index >= this.singleVestPreviews.length
    ) {
      return;
    }

    this.singleVestFiles.splice(index, 1);

    this.singleVestPreviews.splice(index, 1);

  }



  // ==========================================
  // 3 VEST PACK IMAGES
  // ==========================================

  onThreePackImagesSelected(event: Event): void {

    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const files = Array.from(input.files);

    // Maximum 5 images
    if (this.threePackFiles.length + files.length > 5) {

      this.toastr.warning(
        'You can upload maximum 5 Three Pack photos.',
        'Image Limit'
      );

      input.value = '';
      return;
    }

    files.forEach((file) => {

      // Image validation
      if (!file.type.startsWith('image/')) {

        this.toastr.warning(
          `${file.name} is not a valid image.`,
          'Invalid File'
        );

        return;
      }

      // 5MB validation
      if (file.size > 5 * 1024 * 1024) {

        this.toastr.warning(
          `${file.name} is larger than 5MB.`,
          'File Too Large'
        );

        return;
      }

      // Save actual file
      this.threePackFiles.push(file);

      // Create preview
      const reader = new FileReader();

      reader.onload = () => {

        this.threePackPreviews.push(
          reader.result as string
        );

      };

      reader.readAsDataURL(file);

    });

    // Allow same file to be selected again
    input.value = '';

  }


  removeThreePackImage(index: number): void {

    if (
      index < 0 ||
      index >= this.threePackPreviews.length
    ) {
      return;
    }

    this.threePackFiles.splice(index, 1);

    this.threePackPreviews.splice(index, 1);

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

    const currentSizes = Array.isArray(this.newProduct.sizes)
      ? [...this.newProduct.sizes]
      : [];

    if (currentSizes.includes(size)) {

      this.newProduct.sizes =
        currentSizes.filter(s => s !== size);

    } else {

      this.newProduct.sizes = [
        ...currentSizes,
        size
      ];
    }

    // Keep selectedSizes in sync
    this.selectedSizes = [...this.newProduct.sizes];

    console.log('Selected Sizes:', this.newProduct.sizes);
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


  // ==========================================
  // GENERIC PACK BUILDER METHODS
  // ==========================================

  addPack(): void {

    const pack = {
      id: 'pack-' + Date.now(),

      name: '',

      quantity: 1,

      price: 0,

      originalPrice: 0,

      discount: 0,

      colors: [],

      sizes: [],

      files: [] as File[],

      previews: [] as string[]
    };

    this.productPacks.push(pack);
  }


  // ==========================================
  // REMOVE PACK
  // ==========================================

  removePack(index: number): void {

    if (
      index < 0 ||
      index >= this.productPacks.length
    ) {
      return;
    }

    this.productPacks.splice(index, 1);
  }


  // ==========================================
  // PACK COLOR
  // ==========================================

  togglePackColor(
    pack: any,
    color: string
  ): void {

    if (!pack.colors) {
      pack.colors = [];
    }

    const index = pack.colors.indexOf(color);

    if (index > -1) {

      pack.colors.splice(index, 1);

    } else {

      pack.colors.push(color);

    }
  }


  // ==========================================
  // PACK SIZE
  // ==========================================

  togglePackSize(
    pack: any,
    size: string
  ): void {

    if (!pack.sizes) {
      pack.sizes = [];
    }

    const index = pack.sizes.indexOf(size);

    if (index > -1) {

      pack.sizes.splice(index, 1);

    } else {

      pack.sizes.push(size);

    }
  }


  // ==========================================
  // PACK IMAGES
  // ==========================================

  onPackImagesSelected(
    event: Event,
    packIndex: number
  ): void {

    const input =
      event.target as HTMLInputElement;

    if (
      !input.files ||
      input.files.length === 0
    ) {
      return;
    }

    const pack =
      this.productPacks[packIndex];

    if (!pack) {
      return;
    }

    if (!pack.files) {
      pack.files = [];
    }

    if (!pack.previews) {
      pack.previews = [];
    }


    const files =
      Array.from(input.files);


    // Maximum 5 photos per pack
    if (
      pack.files.length + files.length > 5
    ) {

      this.toastr.warning(
        'Maximum 5 photos allowed per pack.',
        'Image Limit'
      );

      input.value = '';

      return;
    }


    files.forEach((file: File) => {

      // Image validation
      if (!file.type.startsWith('image/')) {

        this.toastr.warning(
          `${file.name} is not a valid image.`,
          'Invalid File'
        );

        return;
      }


      // 5MB validation
      if (
        file.size > 5 * 1024 * 1024
      ) {

        this.toastr.warning(
          `${file.name} is larger than 5MB.`,
          'File Too Large'
        );

        return;
      }


      // Save actual file
      pack.files.push(file);


      // Create preview
      const reader =
        new FileReader();

      reader.onload = () => {

        pack.previews.push(
          reader.result as string
        );

      };

      reader.readAsDataURL(file);

    });


    // Allow same file again
    input.value = '';
  }

  removePackImage(
    packIndex: number,
    imageIndex: number
  ): void {

    const pack = this.productPacks[packIndex];

    if (!pack) {
      return;
    }

    const image = pack.previews?.[imageIndex];

    if (!image) {
      return;
    }

    // ==========================================
    // EXISTING IMAGE
    // ==========================================

    if (
      image.startsWith('http') &&
      Array.isArray(pack.existingImages)
    ) {

      pack.existingImages =
        pack.existingImages.filter(
          (existingImage: string) =>
            existingImage !== image
        );

      if (!Array.isArray(pack.removedImages)) {
        pack.removedImages = [];
      }

      pack.removedImages.push(image);
    }

    // ==========================================
    // REMOVE FROM PREVIEW
    // ==========================================

    pack.previews =
      pack.previews.filter(
        (_: string, index: number) =>
          index !== imageIndex
      );

    // ==========================================
    // NEWLY SELECTED FILE
    // ==========================================

    if (
      Array.isArray(pack.files) &&
      !image.startsWith('http')
    ) {

      const fileIndex =
        imageIndex - pack.existingImages.length;

      if (
        fileIndex >= 0 &&
        fileIndex < pack.files.length
      ) {
        pack.files.splice(fileIndex, 1);
      }
    }

    console.log(
      'PACK AFTER IMAGE REMOVE:',
      pack
    );
  }


  // ==========================================
  // COLOR COMBINATION
  // ==========================================

  addColorCombination(): void {

    const combination = {

      id:
        'combination-' +
        Date.now(),

      name: '',

      colors: [],

      files: [] as File[],

      previews: [] as string[]

    };

    this.colorCombinations.push(
      combination
    );
  }


  // ==========================================
  // REMOVE COLOR COMBINATION
  // ==========================================

  removeColorCombination(
    index: number
  ): void {

    if (
      index < 0 ||
      index >= this.colorCombinations.length
    ) {
      return;
    }

    this.colorCombinations.splice(
      index,
      1
    );
  }


  // ==========================================
  // COMBINATION COLOR
  // ==========================================

  toggleCombinationColor(
    combination: any,
    color: string
  ): void {

    if (!combination.colors) {
      combination.colors = [];
    }

    const index =
      combination.colors.indexOf(color);

    if (index > -1) {

      combination.colors.splice(
        index,
        1
      );

    } else {

      combination.colors.push(
        color
      );

    }
  }


  // ==========================================
  // COMBINATION IMAGES
  // ==========================================

  onCombinationImagesSelected(
    event: Event,
    combinationIndex: number
  ): void {

    const input =
      event.target as HTMLInputElement;

    if (
      !input.files ||
      input.files.length === 0
    ) {
      return;
    }

    const combination =
      this.colorCombinations[
      combinationIndex
      ];

    if (!combination) {
      return;
    }

    if (!combination.files) {
      combination.files = [];
    }

    if (!combination.previews) {
      combination.previews = [];
    }


    const files =
      Array.from(input.files);


    // Maximum 5 photos
    if (
      combination.files.length +
      files.length > 5
    ) {

      this.toastr.warning(
        'Maximum 5 photos allowed per combination.',
        'Image Limit'
      );

      input.value = '';

      return;
    }


    files.forEach((file: File) => {

      if (!file.type.startsWith('image/')) {

        this.toastr.warning(
          `${file.name} is not a valid image.`,
          'Invalid File'
        );

        return;
      }


      if (
        file.size > 5 * 1024 * 1024
      ) {

        this.toastr.warning(
          `${file.name} is larger than 5MB.`,
          'File Too Large'
        );

        return;
      }


      combination.files.push(file);


      const reader =
        new FileReader();

      reader.onload = () => {

        combination.previews.push(
          reader.result as string
        );

      };

      reader.readAsDataURL(file);

    });


    input.value = '';
  }


  // ==========================================
  // REMOVE COMBINATION IMAGE
  // ==========================================

  removeCombinationImage(
    combinationIndex: number,
    imageIndex: number
  ): void {

    const combination =
      this.colorCombinations[combinationIndex];

    if (!combination) {
      return;
    }

    const image =
      combination.previews?.[imageIndex];

    if (!image) {
      return;
    }

    // ==========================================
    // EXISTING IMAGE
    // ==========================================

    if (
      image.startsWith('http') &&
      Array.isArray(combination.existingImages)
    ) {

      combination.existingImages =
        combination.existingImages.filter(
          (existingImage: string) =>
            existingImage !== image
        );

      if (
        !Array.isArray(
          combination.removedImages
        )
      ) {
        combination.removedImages = [];
      }

      combination.removedImages.push(image);
    }

    // ==========================================
    // REMOVE PREVIEW
    // ==========================================

    combination.previews =
      combination.previews.filter(
        (_: string, index: number) =>
          index !== imageIndex
      );

    // ==========================================
    // NEWLY SELECTED FILE
    // ==========================================

    if (
      Array.isArray(combination.files) &&
      !image.startsWith('http')
    ) {

      const fileIndex =
        imageIndex -
        combination.existingImages.length;

      if (
        fileIndex >= 0 &&
        fileIndex < combination.files.length
      ) {
        combination.files.splice(
          fileIndex,
          1
        );
      }
    }

    console.log(
      'COMBINATION AFTER IMAGE REMOVE:',
      combination
    );
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