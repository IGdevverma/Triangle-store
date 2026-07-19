import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart } from 'chart.js/auto';
import { ProductService } from '../../services/product';
import { Product } from '../../models/product';
import { ViewChild, ElementRef } from '@angular/core';
import { OrderService } from '../../services/order';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AdminService } from '../../services/admin';
import { UserService } from '../../services/user';
import { QuoteService } from '../../services/quote';
import { Quotes } from '../quotes/quotes';


@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, Quotes],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})


export class Admin implements OnInit, AfterViewInit {
  changeRole(user: any, role: string) {

    this.userService.updateRole(user._id, role).subscribe({

      next: (response: any) => {

        alert(response.message);

        user.role = role;

      },

      error: (err) => {

        console.error(err);

        alert(err.error?.message || "Failed to update role");

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

  customerSearch = '';
  salesChart: any;
  searchTerm = '';
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
  selectedFile: File | null = null;
  imagePreview = '';
  lowStockProducts: Product[] = [];
  orders: any[] = [];
  quotes: any[] = [];

  filteredQuotes: any[] = [];

  quoteSearch = '';
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
    showOnHome: true,
    availableColors: ''

  };
  get totalPages(): number {

    let filtered = this.products.filter(product =>
      product.name
        .toLowerCase()
        .includes(this.searchTerm.toLowerCase())
    );

    if (this.selectedStock === 'In Stock') {
      filtered = filtered.filter(product => (product.stock ?? 0) > 0);
    }

    if (this.selectedStock === 'Out of Stock') {
      filtered = filtered.filter(product => (product.stock ?? 0) === 0);
    }

    if (this.selectedStock === 'Low Stock') {
      filtered = filtered.filter(product => (product.stock ?? 0) <= 5);
    }

    return Math.ceil(filtered.length / this.itemsPerPage);

  }

  constructor(

    private productService: ProductService,
    private orderService: OrderService,
    private adminService: AdminService,
    private userService: UserService,
    private quoteService: QuoteService

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

        alert(response.message);

        this.loadCustomers();

      },

      error: (err) => {

        console.error(err);

        alert(err.error?.message || 'Failed to delete customer');

      }

    });

  }


  changeOrderStatus(order: any, status: string) {

    this.orderService.updateOrderStatus(

      order._id,

      status

    ).subscribe({

      next: () => {

        order.orderStatus = status;

        alert('Order status updated successfully.');

      },

      error: (err) => {

        console.error(err);

        alert('Failed to update order status.');

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

  addProduct() {
    alert("addProduct called");



    if (!this.isFormValid()) {

      alert('Please fill all fields correctly.');

      return;

    }



    const formData = new FormData();

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
    formData.append(
      'colors',
      JSON.stringify(this.newProduct.colors)
    );


    formData.append('stock', String(this.newProduct.stock));

    formData.append('showOnHome', String(this.newProduct.showOnHome));

    formData.append('image', this.selectedFile!);




    this.productService.addProduct(formData).subscribe({


      next: (res) => {



        alert("Product Added");
        this.currentPage = 1;

        this.closeModal();

        this.loadProducts();

      },

      error: (err) => {

        alert("Error: " + JSON.stringify(err.error));
      }

    });



  }


  editProduct(product: Product) {

    this.editing = true;
    this.showModal = true;

    this.newProduct = { ...product };
    this.imagePreview =
      product.image.startsWith('http') ? product.image : '';

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
        category: '',
        stock: 0,
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
      availableColors: '',

      stock: 0,

      showOnHome: true
    };

  }
  closeModal() {

    this.showModal = false;

    this.selectedFile = null;

    this.imagePreview = '';

    this.newProduct = {
      name: '',
      price: 0,
      image: '',
      category: '',
      description: '',
      fabric: '',
      type: '',
      availableColors: '',
      colors: [],
      stock: 0,
      showOnHome: true
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

  onFileSelected(event: any) {

    if (event.target.files.length > 0) {

      this.selectedFile = event.target.files[0];

      const reader = new FileReader();

      reader.onload = () => {

        this.imagePreview = reader.result as string;

      };

      if (this.selectedFile) {
        reader.readAsDataURL(this.selectedFile);
      }

    }

  }

  createSalesChart() {

    // Purana chart destroy karo
    if (this.salesChart) {
      this.salesChart.destroy();
    }

    const labels = this.dashboardData.monthlySales.map((item: any) => {

      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];

      return months[item._id.month - 1];

    });

    const revenue = this.dashboardData.monthlySales.map((item: any) => item.revenue);

    this.salesChart = new Chart(this.salesCanvas.nativeElement, {

      type: 'line',

      data: {

        labels,

        datasets: [

          {

            label: 'Monthly Revenue',

            data: revenue,

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
  downloadInvoice(order: any) {

    const img = new Image();

    img.src = 'assets/images/trianglepng.png';

    img.onload = () => {

      const doc = new jsPDF();
      doc.addImage(img, 'PNG', 15, 12, 20, 20);
      // Company
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("Triangle Sports", 45, 20);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      doc.text("Triangle Sports Pvt. Ltd.", 45, 28);
      doc.text("New Delhi, India", 45, 34);
      doc.text("support@trianglesports.com", 45, 40);
      doc.text("+91 9990180409", 45, 46);

      // Invoice Heading

      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");

      doc.text("TAX INVOICE", 145, 18);

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");

      doc.setFontSize(10);

      doc.text(`Invoice # : ${order._id.slice(-6)}`, 145, 28);

      doc.text(
        `Date : ${new Date(order.createdAt).toLocaleDateString()}`,
        145,
        34
      );

      doc.text(
        `Payment : ${order.paymentStatus}`,
        145,
        40
      );

      doc.setDrawColor(180);

      doc.line(
        15,
        55,
        195,
        55
      );

      // Bill To Box

      doc.setDrawColor(200);
      doc.rect(14, 60, 85, 55);

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("BILL TO", 18, 68);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      doc.text(order.customerName, 18, 76);
      doc.text(order.email, 18, 83);
      doc.text(order.phone, 18, 90);


      doc.rect(111, 60, 84, 55);

      doc.setFont("helvetica", "bold");
      doc.text("SHIPPING ADDRESS", 115, 68);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      const address = doc.splitTextToSize(
        order.address,
        70
      );

      doc.text(address, 115, 76);

      doc.text(
        `${order.city}, ${order.state}`,
        115,
        83
      );

      doc.text(
        order.pincode,
        115,
        90
      );


      // Order Information Box

      doc.setDrawColor(200);
      doc.rect(14, 122, 181, 24);

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");

      doc.text("ORDER INFORMATION", 18, 130);

      doc.setFont("helvetica", "normal");

      doc.text(`Order ID : ${order._id.slice(-8)}`, 18, 138);
      doc.text(`Payment : ${order.paymentStatus}`, 85, 138);
      doc.text(`Status : ${order.orderStatus}`, 145, 138);



      // Products Table
      autoTable(doc, {

        startY: 155,

        head: [[
          "Product",
          "Qty",
          "Price",
          "Total"
        ]],

        body: order.items.map((item: any) => [

          item.name,

          item.quantity,

          `Rs. ${item.price}`,

          `Rs. ${item.price * item.quantity}`

        ]),

        headStyles: {

          fillColor: [109, 40, 217]

        },


        theme: "grid",

        styles: {
          fontSize: 10,
          cellPadding: 4
        },

        columnStyles: {
          1: { halign: "center" },
          2: { halign: "right" },
          3: { halign: "right" }
        },

        foot: [[
          "",
          "",
          "Grand Total",
          `Rs. ${order.total}`
        ]],

        footStyles: {
          fillColor: [235, 235, 235],
          textColor: 0,
          fontStyle: "bold"
        }

      });
      const finalY = (doc as any).lastAutoTable.finalY;
      // Signature

      doc.line(145, finalY + 24, 190, finalY + 24);

      doc.setFontSize(10);

      doc.text(
        "Authorized Signature",
        145,
        finalY + 31
      );


      // Footer

      doc.setDrawColor(180);
      doc.line(14, finalY + 15, 195, finalY + 15);

      doc.setFontSize(9);

      doc.text(
        "Thank you for shopping with Triangle Sports.",
        14,
        finalY + 25
      );

      doc.text(
        "Goods once sold are subject to our return policy.",
        14,
        finalY + 31
      );

      doc.text(
        "www.trianglesports.com",
        14,
        finalY + 37
      );

      doc.save(`invoice-${order._id.slice(-6)}.pdf`);

    };




  }
  getImageUrl(image: string) {

    if (!image) {
      return 'assets/no-image.png';
    }

    if (image.startsWith('http')) {
      return image;
    }

    return 'assets/uploads/' + image;
  }

  viewQuote(id: string) {

    this.loadingQuote = true;

    this.quoteService.getQuote(id).subscribe({

      next: (res) => {

        this.selectedQuote = res.quote;

        this.showQuoteModal = true;

        this.loadingQuote = false;

      },

      error: (err) => {
        this.loadingQuote = false;
        console.error(err);
      }

    });

  }

}
