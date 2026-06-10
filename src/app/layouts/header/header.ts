import { Component, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme';
import { CartService } from '../../services/cart';
import { AuthService } from '../../services/auth';
import { WishlistService } from '../../services/wishlist';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit {

  cartCount = 0;
  wishlistCount = 0;

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private wishlistService: WishlistService,
    private router: Router,
    private themeService: ThemeService
  ) { }

  ngOnInit(): void {

    this.cartService.cart$.subscribe(items => {

      this.cartCount = items.reduce(
        (total, item) => total + item.quantity,
        0
      );

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

}