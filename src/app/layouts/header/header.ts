import { Component, OnInit, HostListener } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme';
import { CartService, CartItem } from '../../services/cart';
import { AuthService } from '../../services/auth';
import { WishlistService } from '../../services/wishlist';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

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
  filterProducts: any;

  @HostListener('window:scroll')
  onWindowScroll() {
    this.isScrolled = window.scrollY > 50;
  }

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private wishlistService: WishlistService,
    private router: Router,
    private themeService: ThemeService,
    private route: ActivatedRoute,


  ) { }

  ngOnInit(): void {

    this.route.queryParams.subscribe(params => {

      if (params['search']) {

        this.searchTerm = params['search'];

        this.filterProducts();

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

  }

  isLoggedIn() {

    return this.authService.isLoggedIn();

  }

  logout() {

    this.authService.logout();

    this.router.navigate(['/login']);

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


  isSearchOpen = false;

  toggleSearch() {
    this.isSearchOpen = !this.isSearchOpen;
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

    }

  }
}