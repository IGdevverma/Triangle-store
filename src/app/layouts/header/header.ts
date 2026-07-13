import { Component, OnInit, HostListener, ElementRef } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme';
import { CartService, CartItem } from '../../services/cart';
import { AuthService } from '../../services/auth';
import { WishlistService } from '../../services/wishlist';
import { FormsModule } from '@angular/forms';
import { Product } from '../../models/product';
import { ProductService } from '../../services/product';


@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit {

  isScrolled = false;
  cartItems: CartItem[] = [];
  total = 0;
  isCartOpen = false;
  cartCount = 0;
  wishlistCount = 0;
  searchTerm = '';
  searchResults: Product[] = [];
  allProducts: Product[] = [];

  user: { name: string; role: string } | null = null;
  isUserMenuOpen = false;

  @HostListener('window:scroll')
  onWindowScroll() {
    this.isScrolled = window.scrollY > 50;
  }
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {

    if (!this.elementRef.nativeElement.contains(event.target)) {

      this.isUserMenuOpen = false;

    }

  }

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private authService: AuthService,
    private wishlistService: WishlistService,
    private router: Router,
    private themeService: ThemeService,
    private route: ActivatedRoute,
    private elementRef: ElementRef


  ) { }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {

      this.user = user;

    });
    console.log('Header User:', this.user);

    this.route.queryParams.subscribe(params => {

      if (params['search']) {

        this.searchTerm = params['search'];



      }

    });

    this.cartService.cart$.subscribe(items => {

      this.cartCount = items.reduce(

        (total, item) => total + item.quantity,

        0

      );
      this.cartItems = items;

      this.total = this.cartService.getTotal();

    });

    this.wishlistService.wishlist$.subscribe(items => {

      this.wishlistCount = items.length;

    });

    this.productService.getProducts().subscribe({

      next: (response: any) => {

        this.allProducts = response.products;

      }

    });

  }



  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  logout() {

    this.authService.logout();

    this.user = null;
    this.isUserMenuOpen = false;

    this.router.navigate(['/']);

  }
  getUserName(): string {

    return this.user?.name || '';

  }

  isAdmin(): boolean {

    return this.user?.role === 'admin';

  }
  toggleTheme() {

    this.themeService.toggleTheme();

  }


  toggleCart() {
    this.isCartOpen = !this.isCartOpen;
  }



  removeItem(productId: string) {

    this.cartService.removeFromCart(productId);

  }

  increase(productId: string) {

    this.cartService.increaseQuantity(productId);

  }

  decrease(productId: string) {

    this.cartService.decreaseQuantity(productId);

  }

  goToCheckout() {

    this.isCartOpen = false;

    this.router.navigate(['/checkout']);

  }
  isMenuOpen = false;

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  toggleUserMenu() {

    this.isUserMenuOpen = !this.isUserMenuOpen;

  }






  isSearchOpen = false;

  toggleSearch() {
    this.isSearchOpen = !this.isSearchOpen;
  }
  filterSearch() {

    const keyword = this.searchTerm.trim().toLowerCase();

    if (!keyword) {

      this.searchResults = [];

      return;

    }

    this.searchResults = this.allProducts
      .filter(product =>

        product.name.toLowerCase().includes(keyword) ||

        product.category.toLowerCase().includes(keyword)

      )
      .slice(0, 5);

  }
  searchProducts() {

    if (this.searchTerm.trim()) {

      this.router.navigate(
        ['/shop'],
        {
          queryParams: {
            search: this.searchTerm
          }
        }
      );

      this.isSearchOpen = false;
      this.searchTerm = '';
    }


  }
}