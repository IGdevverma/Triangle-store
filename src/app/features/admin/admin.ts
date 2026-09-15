import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart } from 'chart.js/auto';

import { ProductService } from '../../services/product';
import { Product } from '../../models/product';
import { OrderService } from '../../services/order';
import { OrderStatus } from '../../models/orders';
import { AdminService } from '../../services/admin';
import { UserService } from '../../services/user';
import { QuoteService } from '../../services/quote';
import { Quotes } from '../quotes/quotes';
import { InvoiceService } from '../../services/invoice.service';

import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { NgxSpinnerService } from 'ngx-spinner';

/* ============================================================
   LOCAL TYPES
   ============================================================ */

type ProductMode = 'single' | 'pack';

interface ProductPackEditor {
  id: string;
  name: string;
  quantity: number;
  price: number;
  originalPrice: number;
  discount: number;
  colors: string[];
  sizes: string[];

  /** New files selected from the computer */
  files: File[];

  /** Existing + new image previews */
  previews: string[];

  /** Existing Cloudinary images */
  existingImages: string[];

  /** Existing images removed by the user */
  removedImages: string[];
}

interface ColorCombinationEditor {
  id: string;
  name: string;
  colors: string[];

  files: File[];
  previews: string[];
  existingImages: string[];
  removedImages: string[];
}

interface EditableProduct extends Product {
  productMode: ProductMode;
  availableColors?: string;
  packs?: ProductPackEditor[];
  colorCombinations?: ColorCombinationEditor[];
}

interface DashboardData {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  totalCategories: number;
  totalStock: number;
  inventoryValue: number;
  lowStockProducts: number;
  processingOrders: number;
  packedOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  monthlySales: Array<{
    _id?: {
      month?: number;
      year?: number;
    };
    revenue?: number;
  }>;
}

/* ============================================================
   COMPONENT
   ============================================================ */

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, Quotes],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class Admin implements OnInit, AfterViewInit, OnDestroy {

  /* ==========================================================
     VIEW / NAVIGATION STATE
     ========================================================== */

  activeMenu = 'dashboard';
  showModal = false;
  editing = false;

  currentPage = 1;
  readonly itemsPerPage = 5;

  searchTerm = '';
  selectedStock = 'All';
  selectedSort = 'Newest';

  customerSearch = '';
  quoteSearch = '';

  today = new Date();

  /* ==========================================================
     DASHBOARD
     ========================================================== */

  @ViewChild('salesCanvas')
  salesCanvas?: ElementRef<HTMLCanvasElement>;

  salesChart?: Chart;

  dashboardData: DashboardData = {
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
    monthlySales: []
  };

  /* ==========================================================
     PRODUCTS
     ========================================================== */

  products: Product[] = [];
  lowStockProducts: Product[] = [];

  totalProducts = 0;
  totalStock = 0;
  totalCategories = 0;
  inventoryValue = 0;
  mostExpensiveProduct = '';

  /* ==========================================================
     ORDERS / CUSTOMERS / QUOTES
     ========================================================== */

  orders: any[] = [];
  customers: any[] = [];
  filteredCustomers: any[] = [];

  quotes: any[] = [];
  filteredQuotes: any[] = [];

  selectedQuote: any = null;
  showQuoteModal = false;
  loadingQuote = false;

  /* ==========================================================
     PRODUCT EDITOR
     ========================================================== */

  availableSizes: string[] = ['S', 'M', 'L', 'XL'];

  availableColors: string[] = [
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
  newSize = '';

  productPacks: ProductPackEditor[] = [];
  colorCombinations: ColorCombinationEditor[] = [];

  /* ==========================================================
     PRODUCT IMAGE STATE
     ========================================================== */

  /**
   * selectedFiles contains only NEW files selected from the
   * computer. Their order matches the NEW/local previews.
   */
  selectedFiles: File[] = [];

  /**
   * imagePreviews contains both existing Cloudinary URLs and
   * local data URLs. The first item is treated as the main image.
   */
  imagePreviews: string[] = [];

  /** Existing Cloudinary images currently kept by the user. */
  existingImages: string[] = [];

  /** Existing Cloudinary images the user removed. */
  removedImages: string[] = [];

  /* ==========================================================
     LEGACY COMPATIBILITY STATE
     ----------------------------------------------------------
     These are retained only because older templates/code may
     still reference them. They are NOT used by the new product
     editor flow.
     ========================================================== */

  galleryFiles: File[] = [];
  galleryPreviews: string[] = [];

  singleVestFiles: File[] = [];
  singleVestPreviews: string[] = [];

  threePackFiles: File[] = [];
  threePackPreviews: string[] = [];

  /* ==========================================================
     EMPTY PRODUCT FACTORY
     ========================================================== */

  private createEmptyProduct(): EditableProduct {
    return {
      name: '',
      price: 0,
      image: '',
      category: '',
      brand: '',
      originalPrice: 0,
      description: '',
      fabric: '',
      type: '',
      productMode: 'single',
      sku: '',
      productGroup: '',
      discount: 0,

      colors: [],
      sizes: [],
      status: 'Active',
      stock: 0,
      showOnHome: true,
      availableColors: '',
      packs: [],
      colorCombinations: []
    } as EditableProduct;
  }

  newProduct: EditableProduct = this.createEmptyProduct();

  /* ==========================================================
     CONSTRUCTOR
     ========================================================== */

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

  /* ==========================================================
     LIFECYCLE
     ========================================================== */

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

  ngOnDestroy(): void {
    this.salesChart?.destroy();
  }

  /* ==========================================================
     API LOADERS
     ========================================================== */

  loadProducts(): void {
    this.productService.getProducts(true).subscribe({
      next: (response: any) => {
        const data: Product[] = Array.isArray(response?.products)
          ? response.products
          : [];

        this.products = data;
        this.calculateProductMetrics();
        this.ensureValidCurrentPage();
      },
      error: (error) => {
        console.error('Failed to load products:', error);
        this.toastr.error(
          error?.error?.message || 'Failed to load products.',
          'Products'
        );
      }
    });
  }

  private calculateProductMetrics(): void {
    this.totalProducts = this.products.length;

    this.totalStock = this.products.reduce(
      (sum, product) => sum + this.toNumber(product.stock),
      0
    );

    this.lowStockProducts = this.products.filter(
      product => this.toNumber(product.stock) <= 5
    );

    this.totalCategories = new Set(
      this.products
        .map(product => product.category?.trim())
        .filter(Boolean)
    ).size;

    this.inventoryValue = this.products.reduce(
      (sum, product) =>
        sum +
        this.toNumber(product.price) *
        this.toNumber(product.stock),
      0
    );

    const expensive = this.products.reduce<Product | null>(
      (current, product) => {
        if (!current) {
          return product;
        }

        return this.toNumber(product.price) >
          this.toNumber(current.price)
          ? product
          : current;
      },
      null
    );

    this.mostExpensiveProduct = expensive?.name || '';
  }

  loadOrders(): void {
    this.orderService.getOrders().subscribe({
      next: (response: any) => {
        this.orders = Array.isArray(response?.orders)
          ? response.orders
          : [];
      },
      error: (error) => {
        console.error('Failed to load orders:', error);
        this.toastr.error(
          error?.error?.message || 'Failed to load orders.',
          'Orders'
        );
      }
    });
  }

  loadDashboard(): void {
    this.adminService.getDashboard().subscribe({
      next: (response: any) => {
        this.dashboardData = {
          ...this.dashboardData,
          ...(response?.dashboard || {}),
          monthlySales: Array.isArray(response?.dashboard?.monthlySales)
            ? response.dashboard.monthlySales
            : []
        };

        this.createSalesChart();
      },
      error: (error) => {
        console.error('Failed to load dashboard:', error);
        this.toastr.error(
          error?.error?.message || 'Failed to load dashboard.',
          'Dashboard'
        );
      }
    });
  }

  loadCustomers(): void {
    this.userService.getUsers().subscribe({
      next: (response: any) => {
        this.customers = Array.isArray(response?.users)
          ? response.users
          : [];

        this.filterCustomers();
      },
      error: (error) => {
        console.error('Failed to load customers:', error);
        this.toastr.error(
          error?.error?.message || 'Failed to load customers.',
          'Customers'
        );
      }
    });
  }

  loadQuotes(): void {
    this.quoteService.getQuotes().subscribe({
      next: (response: any) => {
        this.quotes = Array.isArray(response?.quotes)
          ? response.quotes
          : [];

        this.filterQuotes();
      },
      error: (error) => {
        console.error('Failed to load quotes:', error);
        this.toastr.error(
          error?.error?.message || 'Failed to load quotes.',
          'Quotes'
        );
      }
    });
  }

  /* ==========================================================
     CUSTOMER MANAGEMENT
     ========================================================== */

  filterCustomers(): void {
    const search = this.customerSearch.trim().toLowerCase();

    if (!search) {
      this.filteredCustomers = [...this.customers];
      return;
    }

    this.filteredCustomers = this.customers.filter(user => {
      const name = String(user?.name || '').toLowerCase();
      const email = String(user?.email || '').toLowerCase();
      const phone = String(user?.phone || '').toLowerCase();

      return (
        name.includes(search) ||
        email.includes(search) ||
        phone.includes(search)
      );
    });
  }

  changeRole(user: any, role: string): void {
    if (!user?._id || !role) {
      return;
    }

    const previousRole = user.role;

    this.userService.updateRole(user._id, role).subscribe({
      next: (response: any) => {
        user.role = role;

        this.toastr.success(
          response?.message || 'Role updated successfully.',
          'Success'
        );
      },
      error: (error) => {
        user.role = previousRole;

        console.error('Role update failed:', error);

        this.toastr.error(
          error?.error?.message || 'Failed to update role.',
          'Error'
        );
      }
    });
  }

  deleteCustomer(id: string): void {
    if (!id) {
      return;
    }

    Swal.fire({
      title: 'Delete Customer?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#6B7280'
    }).then(result => {
      if (!result.isConfirmed) {
        return;
      }

      this.spinner.show();

      this.userService.deleteUser(id).subscribe({
        next: () => {
          this.spinner.hide();

          this.toastr.success(
            'Customer deleted successfully.',
            'Deleted'
          );

          this.loadCustomers();
        },
        error: (error) => {
          this.spinner.hide();

          console.error('Customer delete failed:', error);

          this.toastr.error(
            error?.error?.message || 'Failed to delete customer.',
            'Error'
          );
        }
      });
    });
  }

  /* ==========================================================
     QUOTE SEARCH
     ========================================================== */

  filterQuotes(): void {
    const search = this.quoteSearch.trim().toLowerCase();

    if (!search) {
      this.filteredQuotes = [...this.quotes];
      return;
    }

    this.filteredQuotes = this.quotes.filter(quote => {
      const name = String(quote?.name || quote?.customerName || '').toLowerCase();
      const email = String(quote?.email || '').toLowerCase();
      const phone = String(quote?.phone || '').toLowerCase();

      return (
        name.includes(search) ||
        email.includes(search) ||
        phone.includes(search)
      );
    });
  }

  /* ==========================================================
     ORDER MANAGEMENT
     ========================================================== */

  changeOrderStatus(
    order: any,
    status: OrderStatus
  ): void {
    if (!order?._id) {
      this.toastr.error('Invalid order.', 'Error');
      return;
    }

    if (!status) {
      this.toastr.warning(
        'Please select a valid order status.',
        'Invalid Status'
      );
      return;
    }

    const previousStatus = order.orderStatus;

    this.orderService
      .updateOrderStatus(order._id, status)
      .subscribe({
        next: (response: any) => {
          order.orderStatus = status;

          this.toastr.success(
            response?.message ||
            'Order status updated successfully.',
            'Updated'
          );
        },
        error: (error) => {
          order.orderStatus = previousStatus;

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

  downloadInvoice(order: any): void {
    if (!order) {
      return;
    }

    this.invoiceService.generateInvoice(order);
  }

  /* ==========================================================
     PRODUCT FILTERING / PAGINATION
     ========================================================== */

  get filteredProducts(): Product[] {
    let filtered = [...this.products];

    const search = this.searchTerm.trim().toLowerCase();

    if (search) {
      filtered = filtered.filter(product =>
        String(product?.name || '')
          .toLowerCase()
          .includes(search)
      );
    }

    switch (this.selectedStock) {
      case 'In Stock':
        filtered = filtered.filter(
          product => this.toNumber(product.stock) > 0
        );
        break;

      case 'Out of Stock':
        filtered = filtered.filter(
          product => this.toNumber(product.stock) === 0
        );
        break;

      case 'Low Stock':
        filtered = filtered.filter(
          product => this.toNumber(product.stock) <= 5
        );
        break;
    }

    switch (this.selectedSort) {
      case 'Price Low → High':
        filtered.sort(
          (a, b) =>
            this.toNumber(a.price) -
            this.toNumber(b.price)
        );
        break;

      case 'Price High → Low':
        filtered.sort(
          (a, b) =>
            this.toNumber(b.price) -
            this.toNumber(a.price)
        );
        break;

      case 'Name A → Z':
        filtered.sort((a, b) =>
          String(a.name || '').localeCompare(
            String(b.name || '')
          )
        );
        break;

      case 'Stock Highest':
        filtered.sort(
          (a, b) =>
            this.toNumber(b.stock) -
            this.toNumber(a.stock)
        );
        break;

      case 'Newest':
      default:
        break;
    }

    const start =
      (this.currentPage - 1) *
      this.itemsPerPage;

    return filtered.slice(
      start,
      start + this.itemsPerPage
    );
  }

  get totalPages(): number {
    const count = this.getFilteredProductCount();

    return Math.max(
      1,
      Math.ceil(count / this.itemsPerPage)
    );
  }

  private getFilteredProductCount(): number {
    let filtered = [...this.products];

    const search = this.searchTerm.trim().toLowerCase();

    if (search) {
      filtered = filtered.filter(product =>
        String(product?.name || '')
          .toLowerCase()
          .includes(search)
      );
    }

    switch (this.selectedStock) {
      case 'In Stock':
        filtered = filtered.filter(
          product => this.toNumber(product.stock) > 0
        );
        break;

      case 'Out of Stock':
        filtered = filtered.filter(
          product => this.toNumber(product.stock) === 0
        );
        break;

      case 'Low Stock':
        filtered = filtered.filter(
          product => this.toNumber(product.stock) <= 5
        );
        break;
    }

    return filtered.length;
  }

  get pages(): number[] {
    return Array.from(
      { length: this.totalPages },
      (_, index) => index + 1
    );
  }

  onProductFilterChange(): void {
    this.currentPage = 1;
    this.ensureValidCurrentPage();
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.currentPage = page;
  }

  private ensureValidCurrentPage(): void {
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }

    if (this.currentPage < 1) {
      this.currentPage = 1;
    }
  }

  /* ==========================================================
     PRODUCT MODAL
     ========================================================== */

  openAddModal(): void {
    this.editing = false;
    this.showModal = true;
    this.resetProductEditor();
  }

  closeModal(): void {
    this.showModal = false;
    this.editing = false;
    this.resetProductEditor();
  }

  private resetProductEditor(): void {
    this.newProduct = this.createEmptyProduct();

    this.productPacks = [];
    this.colorCombinations = [];

    this.selectedFiles = [];
    this.imagePreviews = [];
    this.existingImages = [];
    this.removedImages = [];

    this.selectedSizes = [];
    this.selectedColors = [];
    this.newSize = '';

    this.galleryFiles = [];
    this.galleryPreviews = [];

    this.singleVestFiles = [];
    this.singleVestPreviews = [];

    this.threePackFiles = [];
    this.threePackPreviews = [];
  }

  /* ==========================================================
     EDIT PRODUCT
     ========================================================== */

  editProduct(product: Product): void {
    if (!product) {
      return;
    }

    this.editing = true;
    this.showModal = true;

    const colors = this.normalizeStringArray(product.colors);

    const sizes = this.normalizeStringArray(product.sizes);

    const productMode = this.resolveProductMode(product);

    this.newProduct = {
      ...product,
      productMode,
      price: this.toNumber(product.price),
      originalPrice: this.toNumber(product.originalPrice),
      discount: this.toNumber(product.discount),
      stock: this.toNumber(product.stock),
      colors,
      sizes,
      availableColors: colors.join(', ')
    } as EditableProduct;

    this.selectedColors = [...colors];
    this.selectedSizes = [...sizes];

    this.calculateDiscount();

    this.productPacks = this.mapExistingPacks(
      Array.isArray((product as EditableProduct).packs)
        ? (product as EditableProduct).packs!
        : []
    );

    this.colorCombinations =
      this.mapExistingCombinations(
        Array.isArray(
          (product as EditableProduct).colorCombinations
        )
          ? (product as EditableProduct)
            .colorCombinations!
          : []
      );

    this.selectedFiles = [];
    this.removedImages = [];

    this.existingImages =
      Array.isArray((product as any).images) &&
        (product as any).images.length
        ? [...(product as any).images]
        : product.image
          ? [product.image]
          : [];

    this.imagePreviews = [...this.existingImages];

    this.clearLegacyImageState();
  }

  private resolveProductMode(product: Product): ProductMode {
    const persistedMode = (product as any)?.productMode;

    if (
      persistedMode === 'single' ||
      persistedMode === 'pack'
    ) {
      return persistedMode;
    }

    return Array.isArray((product as any)?.packs) &&
      (product as any).packs.length > 0
      ? 'pack'
      : 'single';
  }

  private mapExistingPacks(
    packs: any[]
  ): ProductPackEditor[] {
    return packs.map((pack: any, index: number) => {
      const existingImages =
        Array.isArray(pack?.images)
          ? [...pack.images]
          : pack?.image
            ? [pack.image]
            : [];

      return {
        id:
          String(pack?.id || '') ||
          `pack-${Date.now()}-${index}`,

        name: String(pack?.name || ''),

        quantity: Math.max(
          1,
          this.toNumber(pack?.quantity) || 1
        ),

        price: this.toNumber(pack?.price),

        originalPrice: this.toNumber(
          pack?.originalPrice
        ),

        discount: this.toNumber(pack?.discount),

        colors: this.normalizeStringArray(
          pack?.colors
        ),

        sizes: this.normalizeStringArray(
          pack?.sizes
        ),

        files: [],

        previews: [...existingImages],

        existingImages: [...existingImages],

        removedImages: []
      };
    });
  }

  private mapExistingCombinations(
    combinations: any[]
  ): ColorCombinationEditor[] {
    return combinations.map(
      (combination: any, index: number) => {
        const existingImages =
          Array.isArray(combination?.images)
            ? [...combination.images]
            : combination?.image
              ? [combination.image]
              : [];

        return {
          id:
            String(combination?.id || '') ||
            `combination-${Date.now()}-${index}`,

          name: String(
            combination?.name || ''
          ),

          colors: this.normalizeStringArray(
            combination?.colors
          ),

          files: [],

          previews: [...existingImages],

          existingImages: [...existingImages],

          removedImages: []
        };
      }
    );
  }

  /* ==========================================================
     PRODUCT CREATE / UPDATE
     ========================================================== */

  addProduct(): void {
    if (!this.validateProductForm()) {
      return;
    }

    const formData = this.buildProductFormData(false);

    this.productService
      .addProduct(formData)
      .subscribe({
        next: () => {
          this.toastr.success(
            'Product added successfully.',
            'Success'
          );

          this.currentPage = 1;
          this.closeModal();
          this.loadProducts();
        },
        error: (error) => {
          console.error(
            'Add product failed:',
            error
          );

          this.toastr.error(
            error?.error?.message ||
            'Failed to add product.',
            'Error'
          );
        }
      });
  }



  updateProduct(): void {
    if (!this.newProduct._id) {
      this.toastr.error(
        'Product ID is missing.',
        'Error'
      );
      return;
    }

    if (!this.validateProductForm()) {
      return;
    }

    const formData = this.buildProductFormData(true);
    console.log('PRICE SENT:', formData.get('price'));
    console.log('ORIGINAL PRICE SENT:', formData.get('originalPrice'));
    console.log('DISCOUNT SENT:', formData.get('discount'));

    this.productService.updateProduct(this.newProduct._id, formData)
    this.productService
      .updateProduct(
        this.newProduct._id,
        formData
      )
      .subscribe({
        next: (response: any) => {
          const updatedProduct =
            response?.product;

          if (updatedProduct) {
            const index =
              this.products.findIndex(
                product =>
                  (product._id || product.id) ===
                  (updatedProduct._id ||
                    updatedProduct.id)
              );

            if (index !== -1) {
              this.products[index] = {
                ...this.products[index],
                ...updatedProduct
              };
            }
          }

          this.toastr.success(
            'Product updated successfully.',
            'Success'
          );

          this.currentPage = 1;
          this.closeModal();
          this.loadProducts();
        },
        error: (error) => {
          console.error(
            'Update product failed:',
            error
          );

          this.toastr.error(
            error?.error?.message ||
            'Failed to update product.',
            'Error'
          );
        }
      });
  }

  private buildProductFormData(
    isUpdate: boolean
  ): FormData {
    const formData = new FormData();

    const isPackProduct =
      this.newProduct.productMode === 'pack';

    const colors = this.normalizeStringArray(
      this.newProduct.colors
    );

    const sizes = this.normalizeStringArray(
      this.newProduct.sizes
    );

    const packs = isPackProduct
      ? this.productPacks.map(pack => ({
        id: pack.id,
        name: pack.name.trim() || 'Pack',
        quantity: Math.max(
          1,
          this.toNumber(pack.quantity)
        ),
        price: this.toNumber(pack.price),
        originalPrice: this.toNumber(
          pack.originalPrice
        ),
        discount: this.calculateDiscountValue(
          pack.price,
          pack.originalPrice
        ),
        colors: this.normalizeStringArray(
          pack.colors
        ),
        sizes: this.normalizeStringArray(
          pack.sizes
        ),
        images: isUpdate
          ? [...pack.existingImages]
          : [],
        image: isUpdate
          ? pack.existingImages[0] || ''
          : '',
        imageCount: pack.files.length,
        removedImages: isUpdate
          ? [...pack.removedImages]
          : []
      }))
      : [];

    const combinations =
      this.colorCombinations.map(
        combination => ({
          id: combination.id,
          name:
            combination.name.trim() ||
            'Color Combination',
          colors:
            this.normalizeStringArray(
              combination.colors
            ),
          images: isUpdate
            ? [...combination.existingImages]
            : [],
          image: isUpdate
            ? combination.existingImages[0] || ''
            : '',
          imageCount: combination.files.length,
          removedImages: isUpdate
            ? [...combination.removedImages]
            : []
        })
      );

    formData.append(
      'name',
      this.newProduct.name?.trim() || ''
    );

   

    formData.append(
      'price',
      String(this.toNumber(this.newProduct.price))
    );

    formData.append(
      'originalPrice',
      String(
        this.toNumber(
          this.newProduct.originalPrice
        )
      )
    );

    formData.append(
      'discount',
      String(
        this.calculateDiscountValue(
          this.newProduct.price,
          this.newProduct.originalPrice
        )
      )
    );

    formData.append(
      'category',
      this.newProduct.category?.trim() || ''
    );

    formData.append(
      'brand',
      this.newProduct.brand?.trim() || ''
    );

    formData.append(
      'description',
      this.newProduct.description?.trim() || ''
    );

    formData.append(
      'fabric',
      this.newProduct.fabric?.trim() || ''
    );

    formData.append(
      'type',
      this.newProduct.type?.trim() || ''
    );

    formData.append(
      'sku',
      this.newProduct.sku?.trim() || ''
    );
    formData.append(
      'productGroup',
      this.newProduct.productGroup?.trim() || ''
    );


    formData.append(
      'productMode',
      this.newProduct.productMode || 'single'
    );
    formData.append(
      'stock',
      String(
        Math.max(
          0,
          this.toNumber(this.newProduct.stock)
        )
      )
    );

    formData.append(
      'showOnHome',
      String(
        this.newProduct.showOnHome ?? true
      )
    );

    /*
     * `colors` is the source of truth.
     *
     * `availableColors` is also sent for backward
     * compatibility with the current backend.
     */
    formData.append(
      'colors',
      JSON.stringify(colors)
    );

    formData.append(
      'availableColors',
      colors.join(', ')
    );

    formData.append(
      'sizes',
      JSON.stringify(sizes)
    );

    formData.append(
      'packs',
      JSON.stringify(packs)
    );

    formData.append(
      'colorCombinations',
      JSON.stringify(combinations)
    );

    /* ========================================================
       MAIN PRODUCT IMAGES
       ======================================================== */

    if (isUpdate) {
      formData.append(
        'existingImages',
        JSON.stringify(
          this.existingImages.filter(
            image =>
              !this.removedImages.includes(image)
          )
        )
      );

      formData.append(
        'removedImages',
        JSON.stringify(this.removedImages)
      );

      const mainImage =
        this.imagePreviews[0];

      /*
       * If the main image is an existing Cloudinary image,
       * explicitly tell the backend which image is primary.
       */
      if (
        mainImage &&
        this.isRemoteImage(mainImage)
      ) {
        formData.append(
          'mainImage',
          mainImage
        );
      }
    } else {
      formData.append(
        'removedImages',
        JSON.stringify([])
      );
    }

    /*
     * New files are appended in the same logical order as
     * their local previews.
     */
    this.selectedFiles.forEach(file => {
      formData.append('images', file);
    });

    /* ========================================================
       PACK IMAGES
       ======================================================== */

    if (isPackProduct) {
      this.productPacks.forEach(pack => {
        pack.files.forEach(file => {
          formData.append(
            'packImages',
            file
          );
        });
      });
    }

    /* ========================================================
       COLOR COMBINATION IMAGES
       ======================================================== */

    this.colorCombinations.forEach(
      combination => {
        combination.files.forEach(file => {
          formData.append(
            'combinationImages',
            file
          );
        });
      }
    );

    return formData;
  }

  /* ==========================================================
     PRODUCT VALIDATION
     ========================================================== */

  isFormValid(): boolean {
    return this.validateProductForm();
  }

  private validateProductForm(): boolean {
    const name =
      this.newProduct.name?.trim() || '';

    if (!name) {
      this.showValidation(
        'Please enter Product Name.'
      );
      return false;
    }

    const price =
      this.toNumber(this.newProduct.price);

    if (price <= 0) {
      this.showValidation(
        'Please enter a valid Product Price.'
      );
      return false;
    }

    const category =
      this.newProduct.category?.trim() || '';

    if (!category) {
      this.showValidation(
        'Please enter Product Category.'
      );
      return false;
    }

    if (
      !this.editing &&
      this.selectedFiles.length === 0
    ) {
      this.showValidation(
        'Please upload a Main Product Image.'
      );
      return false;
    }

    const colors =
      this.normalizeStringArray(
        this.newProduct.colors
      );

    if (colors.length === 0) {
      this.showValidation(
        'Please select at least one Available Color.'
      );
      return false;
    }

    const sizes =
      this.normalizeStringArray(
        this.newProduct.sizes
      );

    if (sizes.length === 0) {
      this.showValidation(
        'Please select at least one Available Size.'
      );
      return false;
    }

    const originalPrice =
      this.toNumber(
        this.newProduct.originalPrice
      );

    if (
      originalPrice > 0 &&
      originalPrice < price
    ) {
      this.showValidation(
        'Original Price must be greater than or equal to Product Price.'
      );
      return false;
    }

    if (
      this.toNumber(this.newProduct.stock) < 0
    ) {
      this.showValidation(
        'Please enter a valid Stock quantity.'
      );
      return false;
    }

    if (
      this.newProduct.productMode === 'pack'
    ) {
      if (this.productPacks.length === 0) {
        this.showValidation(
          'Please add at least one pack for a Pack Product.'
        );
        return false;
      }

      for (
        let index = 0;
        index < this.productPacks.length;
        index++
      ) {
        const pack =
          this.productPacks[index];

        if (!pack.name.trim()) {
          this.showValidation(
            `Please enter a name for Pack ${index + 1}.`
          );
          return false;
        }

        if (
          this.toNumber(pack.quantity) <= 0
        ) {
          this.showValidation(
            `Please enter a valid quantity for Pack ${index + 1}.`
          );
          return false;
        }

        if (
          this.toNumber(pack.price) <= 0
        ) {
          this.showValidation(
            `Please enter a valid selling price for Pack ${index + 1}.`
          );
          return false;
        }

        if (
          this.toNumber(pack.originalPrice) > 0 &&
          this.toNumber(pack.originalPrice) <
          this.toNumber(pack.price)
        ) {
          this.showValidation(
            `Original Price must be greater than or equal to Selling Price for Pack ${index + 1}.`
          );
          return false;
        }
      }
    }

    return true;
  }

  private showValidation(message: string): void {
    this.toastr.warning(
      message,
      'Validation'
    );
  }

  /* ==========================================================
     PRICING
     ========================================================== */

  calculateDiscount(): void {
    this.newProduct.discount =
      this.calculateDiscountValue(
        this.newProduct.price,
        this.newProduct.originalPrice
      );
  }

  calculateProductDiscount(): void {
    this.calculateDiscount();
  }

  calculatePackDiscount(
    pack: ProductPackEditor
  ): void {
    if (!pack) {
      return;
    }

    pack.discount =
      this.calculateDiscountValue(
        pack.price,
        pack.originalPrice
      );
  }

  private calculateDiscountValue(
    price: unknown,
    originalPrice: unknown
  ): number {
    const sellingPrice =
      this.toNumber(price);

    const mrp =
      this.toNumber(originalPrice);

    if (
      sellingPrice > 0 &&
      mrp > sellingPrice
    ) {
      return Math.round(
        ((mrp - sellingPrice) / mrp) * 100
      );
    }

    return 0;
  }

  /* ==========================================================
     COLORS / SIZES
     ========================================================== */

  toggleColor(color: string): void {
    if (!color) {
      return;
    }

    const colors =
      this.normalizeStringArray(
        this.newProduct.colors
      );

    const index =
      colors.indexOf(color);

    if (index >= 0) {
      colors.splice(index, 1);
    } else {
      colors.push(color);
    }

    this.newProduct.colors = colors;
    this.selectedColors = [...colors];

    /*
     * Keep the legacy backend field synchronized.
     */
    this.newProduct.availableColors =
      colors.join(', ');
  }

  toggleSize(size: string): void {
    if (!size) {
      return;
    }

    const sizes =
      this.normalizeStringArray(
        this.newProduct.sizes
      );

    const index =
      sizes.indexOf(size);

    if (index >= 0) {
      sizes.splice(index, 1);
    } else {
      sizes.push(size);
    }

    this.newProduct.sizes = sizes;
    this.selectedSizes = [...sizes];
  }

  addSize(): void {
    const size =
      this.newSize
        .trim()
        .toUpperCase();

    if (!size) {
      return;
    }

    const sizes =
      this.normalizeStringArray(
        this.newProduct.sizes
      );

    if (!sizes.includes(size)) {
      sizes.push(size);
    }

    this.newProduct.sizes = sizes;
    this.selectedSizes = [...sizes];
    this.newSize = '';
  }

  removeSize(index: number): void {
    const sizes =
      this.normalizeStringArray(
        this.newProduct.sizes
      );

    if (
      index < 0 ||
      index >= sizes.length
    ) {
      return;
    }

    sizes.splice(index, 1);

    this.newProduct.sizes = sizes;
    this.selectedSizes = [...sizes];
  }

  getColorValue(color: string): string {
    const colorMap: Record<string, string> = {
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

  /* ==========================================================
     PRODUCT MODE
     ========================================================== */

  onProductModeChange(): void {
    if (
      this.newProduct.productMode === 'single'
    ) {
      /*
       * Single products must never retain stale pack
       * configuration.
       */
      this.productPacks = [];
    }
  }

  /* ==========================================================
     PRODUCT PACK BUILDER
     ========================================================== */

  addPack(): void {
    if (
      this.newProduct.productMode !== 'pack'
    ) {
      this.toastr.info(
        'Switch Product Mode to "Pack Product" before adding a pack.',
        'Pack Builder'
      );
      return;
    }

    this.productPacks.push({
      id: this.createEditorId('pack'),
      name: '',
      quantity: 1,
      price: 0,
      originalPrice: 0,
      discount: 0,
      colors: [],
      sizes: [],
      files: [],
      previews: [],
      existingImages: [],
      removedImages: []
    });
  }

  removePack(index: number): void {
    if (
      index < 0 ||
      index >= this.productPacks.length
    ) {
      return;
    }

    this.productPacks.splice(index, 1);
  }

  togglePackColor(
    pack: ProductPackEditor,
    color: string
  ): void {
    if (!pack || !color) {
      return;
    }

    const index =
      pack.colors.indexOf(color);

    if (index >= 0) {
      pack.colors.splice(index, 1);
    } else {
      pack.colors.push(color);
    }
  }

  togglePackSize(
    pack: ProductPackEditor,
    size: string
  ): void {
    if (!pack || !size) {
      return;
    }

    const index =
      pack.sizes.indexOf(size);

    if (index >= 0) {
      pack.sizes.splice(index, 1);
    } else {
      pack.sizes.push(size);
    }
  }

  /* ==========================================================
     PACK IMAGE MANAGEMENT
     ========================================================== */

  onPackImagesSelected(
    event: Event,
    packIndex: number
  ): void {
    const input =
      event.target as HTMLInputElement;

    const pack =
      this.productPacks[packIndex];

    if (
      !input?.files ||
      input.files.length === 0 ||
      !pack
    ) {
      return;
    }

    const files =
      Array.from(input.files);

    const currentCount =
      pack.previews.length;

    if (
      currentCount + files.length > 5
    ) {
      this.toastr.warning(
        'Maximum 5 photos allowed per pack.',
        'Image Limit'
      );
      input.value = '';
      return;
    }

    files.forEach(file => {
      if (!this.validateImageFile(file)) {
        return;
      }

      pack.files.push(file);

      this.readFileAsDataUrl(file).then(
        preview => {
          pack.previews.push(preview);
        }
      );
    });

    input.value = '';
  }

  removePackImage(
    packIndex: number,
    imageIndex: number
  ): void {
    const pack =
      this.productPacks[packIndex];

    if (!pack) {
      return;
    }

    const image =
      pack.previews[imageIndex];

    if (!image) {
      return;
    }

    if (
      this.isRemoteImage(image)
    ) {
      this.removeExistingImage(
        image,
        pack.existingImages,
        pack.removedImages
      );
    } else {
      const newFileIndex =
        this.getLocalFileIndex(
          pack.previews,
          pack.existingImages,
          imageIndex
        );

      if (
        newFileIndex >= 0 &&
        newFileIndex < pack.files.length
      ) {
        pack.files.splice(
          newFileIndex,
          1
        );
      }
    }

    pack.previews.splice(
      imageIndex,
      1
    );
  }

  /* ==========================================================
     COLOR COMBINATIONS
     ========================================================== */

  addColorCombination(): void {
    this.colorCombinations.push({
      id: this.createEditorId(
        'combination'
      ),
      name: '',
      colors: [],
      files: [],
      previews: [],
      existingImages: [],
      removedImages: []
    });
  }

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

  toggleCombinationColor(
    combination: ColorCombinationEditor,
    color: string
  ): void {
    if (!combination || !color) {
      return;
    }

    const index =
      combination.colors.indexOf(color);

    if (index >= 0) {
      combination.colors.splice(
        index,
        1
      );
    } else {
      combination.colors.push(color);
    }
  }

  onCombinationImagesSelected(
    event: Event,
    combinationIndex: number
  ): void {
    const input =
      event.target as HTMLInputElement;

    const combination =
      this.colorCombinations[
      combinationIndex
      ];

    if (
      !input?.files ||
      input.files.length === 0 ||
      !combination
    ) {
      return;
    }

    const files =
      Array.from(input.files);

    if (
      combination.previews.length +
      files.length >
      5
    ) {
      this.toastr.warning(
        'Maximum 5 photos allowed per combination.',
        'Image Limit'
      );
      input.value = '';
      return;
    }

    files.forEach(file => {
      if (!this.validateImageFile(file)) {
        return;
      }

      combination.files.push(file);

      this.readFileAsDataUrl(file).then(
        preview => {
          combination.previews.push(
            preview
          );
        }
      );
    });

    input.value = '';
  }

  removeCombinationImage(
    combinationIndex: number,
    imageIndex: number
  ): void {
    const combination =
      this.colorCombinations[
      combinationIndex
      ];

    if (!combination) {
      return;
    }

    const image =
      combination.previews[imageIndex];

    if (!image) {
      return;
    }

    if (
      this.isRemoteImage(image)
    ) {
      this.removeExistingImage(
        image,
        combination.existingImages,
        combination.removedImages
      );
    } else {
      const newFileIndex =
        this.getLocalFileIndex(
          combination.previews,
          combination.existingImages,
          imageIndex
        );

      if (
        newFileIndex >= 0 &&
        newFileIndex <
        combination.files.length
      ) {
        combination.files.splice(
          newFileIndex,
          1
        );
      }
    }

    combination.previews.splice(
      imageIndex,
      1
    );
  }

  /* ==========================================================
     MAIN PRODUCT IMAGE MANAGEMENT
     ========================================================== */

  /**
   * Used by the Main Product Image input.
   * The selected image is always placed first.
   */
  onMainImageSelected(
    event: Event
  ): void {
    const input =
      event.target as HTMLInputElement;

    if (
      !input?.files ||
      input.files.length === 0
    ) {
      return;
    }

    const file =
      input.files[0];

    if (!this.validateImageFile(file)) {
      input.value = '';
      return;
    }

    /*
     * New main image:
     * - becomes first preview
     * - becomes first new file
     */
    this.selectedFiles.unshift(file);

    this.readFileAsDataUrl(file).then(
      preview => {
        this.imagePreviews.unshift(
          preview
        );
      }
    );

    input.value = '';
  }

  /**
   * Used by the Additional Images input.
   * It appends images and never changes the main image.
   */
  onProductImagesSelected(
    event: Event
  ): void {
    const input =
      event.target as HTMLInputElement;

    if (
      !input?.files ||
      input.files.length === 0
    ) {
      return;
    }

    const files =
      Array.from(input.files);

    if (
      this.imagePreviews.length +
      files.length >
      5
    ) {
      this.toastr.warning(
        'You can upload maximum 5 images.',
        'Image Limit'
      );
      input.value = '';
      return;
    }

    files.forEach(file => {
      if (!this.validateImageFile(file)) {
        return;
      }

      this.selectedFiles.push(file);

      this.readFileAsDataUrl(file).then(
        preview => {
          this.imagePreviews.push(
            preview
          );
        }
      );
    });

    input.value = '';
  }

  /**
   * Remove product image safely while keeping existing
   * Cloudinary images and new local files separate.
   */
  removeImage(index: number): void {
    if (
      index < 0 ||
      index >= this.imagePreviews.length
    ) {
      return;
    }

    const image =
      this.imagePreviews[index];

    if (this.isRemoteImage(image)) {
      this.removeExistingImage(
        image,
        this.existingImages,
        this.removedImages
      );
    } else {
      const localFileIndex =
        this.getLocalFileIndex(
          this.imagePreviews,
          this.existingImages,
          index
        );

      if (
        localFileIndex >= 0 &&
        localFileIndex <
        this.selectedFiles.length
      ) {
        this.selectedFiles.splice(
          localFileIndex,
          1
        );
      }
    }

    this.imagePreviews.splice(
      index,
      1
    );
  }

  /**
   * Backward-compatible method used by older HTML.
   */
  removeProductImage(index: number): void {
    this.removeImage(index);
  }

  /**
   * Set any existing/local preview as the main image.
   *
   * If the image is a new local file, the matching file is
   * moved to the beginning of selectedFiles too.
   */
  setMainImage(index: number): void {
    if (
      index < 0 ||
      index >= this.imagePreviews.length
    ) {
      return;
    }

    if (index === 0) {
      return;
    }

    const selectedImage =
      this.imagePreviews[index];

    if (
      !this.isRemoteImage(selectedImage)
    ) {
      const localFileIndex =
        this.getLocalFileIndex(
          this.imagePreviews,
          this.existingImages,
          index
        );

      if (
        localFileIndex >= 0 &&
        localFileIndex <
        this.selectedFiles.length
      ) {
        const [
          selectedFile
        ] =
          this.selectedFiles.splice(
            localFileIndex,
            1
          );

        this.selectedFiles.unshift(
          selectedFile
        );
      }
    }

    this.imagePreviews.splice(
      index,
      1
    );

    this.imagePreviews.unshift(
      selectedImage
    );
  }

  /* ==========================================================
     LEGACY PRODUCT IMAGE METHODS
     ----------------------------------------------------------
     Kept as safe aliases so an older template does not break.
     ========================================================== */

  onFilesSelected(event: Event): void {
    this.replaceProductImages(event);
  }

  onGalleryFilesSelected(
    event: Event
  ): void {
    this.replaceProductImages(event);
  }

  onGalleryImagesSelected(
    event: Event
  ): void {
    this.appendProductImages(event);
  }

  removeGalleryImage(index: number): void {
    this.removeImage(index);
  }

  private replaceProductImages(
    event: Event
  ): void {
    const input =
      event.target as HTMLInputElement;

    if (
      !input?.files ||
      input.files.length === 0
    ) {
      return;
    }

    const files =
      Array.from(input.files);

    if (files.length > 5) {
      this.toastr.warning(
        'You can upload maximum 5 images.',
        'Image Limit'
      );
      input.value = '';
      return;
    }

    const validFiles =
      files.filter(file =>
        this.validateImageFile(
          file,
          false
        )
      );

    this.selectedFiles = [];
    this.imagePreviews = [];

    validFiles.forEach(file => {
      this.selectedFiles.push(file);

      this.readFileAsDataUrl(file).then(
        preview => {
          this.imagePreviews.push(
            preview
          );
        }
      );
    });

    input.value = '';
  }

  private appendProductImages(
    event: Event
  ): void {
    this.onProductImagesSelected(
      event
    );
  }

  /* ==========================================================
     LEGACY VEST IMAGE METHODS
     ----------------------------------------------------------
     These remain only for backwards compatibility.
     ========================================================== */

  onSingleVestImagesSelected(
    event: Event
  ): void {
    this.handleLegacyImageCollection(
      event,
      this.singleVestFiles,
      this.singleVestPreviews,
      'Single Vest'
    );
  }

  removeSingleVestImage(
    index: number
  ): void {
    this.removeLegacyImage(
      index,
      this.singleVestFiles,
      this.singleVestPreviews
    );
  }

  onThreePackImagesSelected(
    event: Event
  ): void {
    this.handleLegacyImageCollection(
      event,
      this.threePackFiles,
      this.threePackPreviews,
      'Three Pack'
    );
  }

  removeThreePackImage(
    index: number
  ): void {
    this.removeLegacyImage(
      index,
      this.threePackFiles,
      this.threePackPreviews
    );
  }

  private handleLegacyImageCollection(
    event: Event,
    filesCollection: File[],
    previewCollection: string[],
    label: string
  ): void {
    const input =
      event.target as HTMLInputElement;

    if (
      !input?.files ||
      input.files.length === 0
    ) {
      return;
    }

    const files =
      Array.from(input.files);

    if (
      filesCollection.length +
      files.length >
      5
    ) {
      this.toastr.warning(
        `Maximum 5 ${label} photos allowed.`,
        'Image Limit'
      );
      input.value = '';
      return;
    }

    files.forEach(file => {
      if (!this.validateImageFile(file)) {
        return;
      }

      filesCollection.push(file);

      this.readFileAsDataUrl(file).then(
        preview => {
          previewCollection.push(
            preview
          );
        }
      );
    });

    input.value = '';
  }

  private removeLegacyImage(
    index: number,
    files: File[],
    previews: string[]
  ): void {
    if (
      index < 0 ||
      index >= previews.length
    ) {
      return;
    }

    files.splice(index, 1);
    previews.splice(index, 1);
  }

  /* ==========================================================
     PRODUCT DELETE
     ========================================================== */

  deleteProduct(id: string): void {
    if (!id) {
      return;
    }

    Swal.fire({
      title: 'Delete Product?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel'
    }).then(result => {
      if (!result.isConfirmed) {
        return;
      }

      this.spinner.show();

      this.productService
        .deleteProduct(id)
        .subscribe({
          next: () => {
            this.spinner.hide();

            this.toastr.success(
              'Product deleted successfully.',
              'Deleted'
            );

            this.loadProducts();
          },
          error: (error) => {
            this.spinner.hide();

            console.error(
              'Product delete failed:',
              error
            );

            this.toastr.error(
              error?.error?.message ||
              'Failed to delete product.',
              'Error'
            );
          }
        });
    });
  }

  /* ==========================================================
     SALES CHART
     ========================================================== */

  createSalesChart(): void {
    const canvas =
      this.salesCanvas?.nativeElement;

    if (!canvas) {
      return;
    }

    this.salesChart?.destroy();

    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ];

    const monthlySales =
      Array.isArray(
        this.dashboardData.monthlySales
      )
        ? this.dashboardData.monthlySales
        : [];

    const labels = monthlySales.map(
      item => {
        const month =
          this.toNumber(
            item?._id?.month
          );

        return (
          months[month - 1] ||
          'Unknown'
        );
      }
    );

    const revenue = monthlySales.map(
      item =>
        this.toNumber(
          item?.revenue
        )
    );

    this.salesChart = new Chart(
      canvas,
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

  /* ==========================================================
     HELPERS
     ========================================================== */

  private toNumber(
    value: unknown
  ): number {
    const numberValue =
      Number(value);

    return Number.isFinite(numberValue)
      ? numberValue
      : 0;
  }

  private normalizeStringArray(
    value: unknown
  ): string[] {
    if (!Array.isArray(value)) {
      if (
        typeof value === 'string' &&
        value.trim()
      ) {
        return value
          .split(',')
          .map(item => item.trim())
          .filter(
            item =>
              item &&
              item.toLowerCase() !==
              'undefined'
          );
      }

      return [];
    }

    return value
      .flatMap(item =>
        String(item).split(',')
      )
      .map(item => item.trim())
      .filter(
        item =>
          item &&
          item.toLowerCase() !==
          'undefined'
      )
      .filter(
        (item, index, array) =>
          array.indexOf(item) === index
      );
  }

  private validateImageFile(
    file: File,
    showToast = true
  ): boolean {
    if (
      !file.type.startsWith('image/')
    ) {
      if (showToast) {
        this.toastr.warning(
          `${file.name} is not a valid image.`,
          'Invalid File'
        );
      }
      return false;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      if (showToast) {
        this.toastr.warning(
          `${file.name} is larger than 5MB.`,
          'File Too Large'
        );
      }
      return false;
    }

    return true;
  }

  private readFileAsDataUrl(
    file: File
  ): Promise<string> {
    return new Promise(
      (resolve, reject) => {
        const reader =
          new FileReader();

        reader.onload = () =>
          resolve(
            reader.result as string
          );

        reader.onerror = () =>
          reject(
            new Error(
              `Failed to read ${file.name}`
            )
          );

        reader.readAsDataURL(file);
      }
    );
  }

  private isRemoteImage(
    image: string
  ): boolean {
    return /^https?:\/\//i.test(
      image
    );
  }

  private removeExistingImage(
    image: string,
    existingImages: string[],
    removedImages: string[]
  ): void {
    const existingIndex =
      existingImages.indexOf(image);

    if (existingIndex >= 0) {
      existingImages.splice(
        existingIndex,
        1
      );
    }

    if (
      !removedImages.includes(image)
    ) {
      removedImages.push(image);
    }
  }

  /**
   * Returns the index of a local file based on the
   * preview ordering.
   */
  private getLocalFileIndex(
    previews: string[],
    existingImages: string[],
    previewIndex: number
  ): number {
    let localIndex = 0;

    for (
      let index = 0;
      index < previewIndex;
      index++
    ) {
      const preview =
        previews[index];

      if (
        !existingImages.includes(
          preview
        )
      ) {
        localIndex++;
      }
    }

    return existingImages.includes(
      previews[previewIndex]
    )
      ? -1
      : localIndex;
  }

  private clearLegacyImageState(): void {
    this.galleryFiles = [];
    this.galleryPreviews = [];

    this.singleVestFiles = [];
    this.singleVestPreviews = [];

    this.threePackFiles = [];
    this.threePackPreviews = [];
  }

  private createEditorId(
    prefix: string
  ): string {
    return `${prefix}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
  }
}