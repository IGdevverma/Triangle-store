import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  ElementRef
} from '@angular/core';
import { RouterLink, Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';

import { ThemeService } from '../../services/theme';
import { CartService, CartItem } from '../../services/cart';
import { AuthService } from '../../services/auth';
import { WishlistService } from '../../services/wishlist';
import { Product } from '../../models/product';
import { ProductService } from '../../services/product';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit, OnDestroy {
openComingSoon(section: string): void {
  this.showComingSoon(section);
}
  // =====================================================
  // CART & WISHLIST STATE
  // =====================================================
  cartItems: CartItem[] = [];
  cartCount = 0;
  total = 0;
  isCartOpen = false;
  wishlistCount = 0;

  // =====================================================
  // NAVIGATION & SCROLL STATE (OPTION 4 MEGA MENU)
  // =====================================================
  isScrolled = false;
  isMenuOpen = false;

  // Active desktop mega menu panel
  activeMegaMenu: 'men' | 'women' | 'accessories' | 'custom' | null = null;
  private megaMenuTimer: any = null;

  // Mobile drawer accordion states
  mobileMenExpanded = false;
  mobileWomenExpanded = false;
  mobileAccessoriesExpanded = false;
  mobileCustomExpanded = false;

  // =====================================================
  // USER / AUTH STATE
  // =====================================================
  user: { name: string; role: string } | null = null;
  isUserMenuOpen = false;

  // =====================================================
  // COMING SOON MODAL
  // =====================================================
  showComingSoonModal = false;
  comingSoonSection = '';

  // =====================================================
  // DYNAMIC SEARCH STATE
  // =====================================================
  isSearchOpen = false;
  searchTerm = '';
  searchResults: Product[] = [];
  allProducts: Product[] = [];
  isSearching = false;
  selectedIndex = -1;
  popularCategories: string[] = ['Track Pants', 'Vests', 'Arm Sleeves'];

  private headerProductsLoading = false;
  private searchSubject = new Subject<string>();
  private subscriptions = new Subscription();

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private authService: AuthService,
    private wishlistService: WishlistService,
    private router: Router,
    private themeService: ThemeService,
    private route: ActivatedRoute,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    // Current user subscription
    this.subscriptions.add(
      this.authService.currentUser$.subscribe(user => {
        this.user = user;
      })
    );

    // Sync route search query param if present
    this.subscriptions.add(
      this.route.queryParams.subscribe(params => {
        if (params['search']) {
          this.searchTerm = params['search'];
        }
      })
    );

    // Cart subscription
    this.subscriptions.add(
      this.cartService.cart$.subscribe(items => {
        this.cartCount = items.reduce(
          (sum, item) => sum + item.quantity,
          0
        );
        this.cartItems = items;
        this.total = this.cartService.getTotal();
      })
    );

    // Wishlist subscription
    this.subscriptions.add(
      this.wishlistService.wishlist$.subscribe(items => {
        this.wishlistCount = items.length;
      })
    );

    // Debounced search stream
    this.subscriptions.add(
      this.searchSubject
        .pipe(
          debounceTime(250),
          distinctUntilChanged()
        )
        .subscribe(term => {
          this.executeSearch(term);
        })
    );

    // Automatically close mobile menu and search on route transition
    this.subscriptions.add(
      this.router.events
        .pipe(filter(event => event instanceof NavigationEnd))
        .subscribe(() => {
          this.closeMenu();
          this.closeSearch();
          this.closeMegaMenu();
          this.isUserMenuOpen = false;
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (this.megaMenuTimer) clearTimeout(this.megaMenuTimer);
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  }

  // =====================================================
  // HOST LISTENERS
  // =====================================================
  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.isScrolled = window.scrollY > 40;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isUserMenuOpen = false;
      this.isSearchOpen = false;
      this.selectedIndex = -1;
      this.activeMegaMenu = null;
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.activeMegaMenu) {
      this.activeMegaMenu = null;
      return;
    }
    if (this.isSearchOpen) {
      this.closeSearch();
      return;
    }
    if (this.isMenuOpen) {
      this.closeMenu();
      return;
    }
    if (this.isUserMenuOpen) {
      this.isUserMenuOpen = false;
      return;
    }
    if (this.showComingSoonModal) {
      this.closeComingSoon();
      return;
    }
    if (this.isCartOpen) {
      this.toggleCart();
    }
  }

  // =====================================================
  // MEGA MENU — DESKTOP
  // =====================================================
  openMegaMenu(menu: 'men' | 'women' | 'accessories' | 'custom'): void {
    if (this.megaMenuTimer) {
      clearTimeout(this.megaMenuTimer);
      this.megaMenuTimer = null;
    }
    this.activeMegaMenu = menu;
  }

  scheduleMegaMenuClose(): void {
    this.megaMenuTimer = setTimeout(() => {
      this.activeMegaMenu = null;
    }, 160);
  }

  closeMegaMenu(): void {
    if (this.megaMenuTimer) {
      clearTimeout(this.megaMenuTimer);
      this.megaMenuTimer = null;
    }
    this.activeMegaMenu = null;
  }




  toggleMegaMenu(menu: 'men' | 'women' | 'accessories' | 'custom'): void {
    this.activeMegaMenu = this.activeMegaMenu === menu ? null : menu;
  }

  // =====================================================
  // DYNAMIC SEARCH IMPLEMENTATION
  // =====================================================
  toggleSearch(): void {
    this.isSearchOpen = !this.isSearchOpen;
    if (this.isSearchOpen) {
      this.isUserMenuOpen = false;
      if (!this.allProducts.length) {
        this.loadHeaderProducts();
      }
      setTimeout(() => {
        const input = this.elementRef.nativeElement.querySelector('.search-input-field') as HTMLInputElement | null;
        input?.focus();
      }, 60);
    } else {
      this.selectedIndex = -1;
    }
  }

  closeSearch(): void {
    this.isSearchOpen = false;
    this.selectedIndex = -1;
  }

  onSearchInput(value: string): void {
    this.searchTerm = value;
    this.searchSubject.next(value);
  }

  filterSearch(): void {
    // Retained for direct calls or template event bindings
    this.executeSearch(this.searchTerm);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.searchResults = [];
    this.selectedIndex = -1;
    this.isSearching = false;
    const input = this.elementRef.nativeElement.querySelector('.search-input-field') as HTMLInputElement | null;
    input?.focus();
  }

  quickSearch(term: string): void {
    this.searchTerm = term;
    this.executeSearch(term);
    const input = this.elementRef.nativeElement.querySelector('.search-input-field') as HTMLInputElement | null;
    input?.focus();
  }

  private executeSearch(term: string): void {
    const keyword = (term || '').trim().toLowerCase();

    if (!keyword) {
      this.searchResults = [];
      this.isSearching = false;
      this.selectedIndex = -1;
      return;
    }

    if (!this.allProducts.length) {
      this.isSearching = true;
      this.loadHeaderProducts(keyword);
      return;
    }

    this.isSearching = false;

    // Smart multi-field scoring for athletic sportswear
    const scored = this.allProducts
      .map(product => {
        const name = (product.name || '').toLowerCase();
        const category = (product.category || '').toLowerCase();
        const fabric = (product.fabric || '').toLowerCase();
        let score = 0;

        if (name === keyword) {
          score = 100;
        } else if (name.startsWith(keyword)) {
          score = 80;
        } else if (name.includes(keyword)) {
          score = 60;
        } else if (category === keyword) {
          score = 50;
        } else if (category.includes(keyword)) {
          score = 40;
        } else if (fabric.includes(keyword)) {
          score = 30;
        }

        return { product, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.product);

    this.searchResults = scored.slice(0, 6);
    this.selectedIndex = -1;
  }

  onSearchKeyDown(event: KeyboardEvent): void {
    if (!this.isSearchOpen) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (this.searchResults.length > 0) {
        this.selectedIndex = (this.selectedIndex + 1) % this.searchResults.length;
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (this.searchResults.length > 0) {
        this.selectedIndex =
          (this.selectedIndex - 1 + this.searchResults.length) % this.searchResults.length;
      }
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (this.selectedIndex >= 0 && this.selectedIndex < this.searchResults.length) {
        this.selectProduct(this.searchResults[this.selectedIndex]);
      } else if (this.searchTerm.trim()) {
        this.searchProducts();
      }
    }
  }

  selectProduct(product: Product): void {
    if (!product?._id) return;
    this.closeSearch();
    this.closeMenu();
    this.router.navigate(['/product', product._id]);
  }

  searchProducts(): void {
    const trimmed = this.searchTerm.trim();
    if (trimmed) {
      this.router.navigate(['/shop'], {
        queryParams: { search: trimmed }
      });
      this.closeSearch();
      this.closeMenu();
    }
  }

  private loadHeaderProducts(pendingTerm?: string): void {
    if (this.allProducts.length) {
      if (pendingTerm) this.executeSearch(pendingTerm);
      return;
    }

    if (this.headerProductsLoading) return;
    this.headerProductsLoading = true;
    this.isSearching = true;

    this.productService.getProducts().subscribe({
      next: (response: any) => {
        const list: Product[] = Array.isArray(response?.products)
          ? response.products
          : Array.isArray(response)
            ? response
            : [];
        this.allProducts = list;
        this.headerProductsLoading = false;
        this.isSearching = false;

        const term = pendingTerm ?? this.searchTerm;
        if (term) {
          this.executeSearch(term);
        }
      },
      error: error => {
        console.error('Failed to load products for header search:', error);
        this.headerProductsLoading = false;
        this.isSearching = false;
      }
    });
  }

  // =====================================================
  // MOBILE NAVIGATION DRAWER
  // =====================================================
  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
    if (this.isMenuOpen) {
      this.isSearchOpen = false;
      this.isUserMenuOpen = false;
    }
    this.updateScrollLock();
  }

  closeMenu(): void {
    if (this.isMenuOpen) {
      this.isMenuOpen = false;
      this.updateScrollLock();
    }
  }

  toggleMobileMen(event?: Event): void {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    this.mobileMenExpanded = !this.mobileMenExpanded;
  }

  toggleMobileSection(section: 'men' | 'women' | 'accessories' | 'custom', event?: Event): void {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    switch (section) {
      case 'men':         this.mobileMenExpanded = !this.mobileMenExpanded; break;
      case 'women':       this.mobileWomenExpanded = !this.mobileWomenExpanded; break;
      case 'accessories': this.mobileAccessoriesExpanded = !this.mobileAccessoriesExpanded; break;
      case 'custom':      this.mobileCustomExpanded = !this.mobileCustomExpanded; break;
    }
  }

  private updateScrollLock(): void {
    if (typeof document !== 'undefined') {
      if (this.isMenuOpen || this.isCartOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
  }

  // =====================================================
  // CART HELPERS & ACTIONS
  // =====================================================
  getVariantLabel(item: CartItem): string {
    const parts: string[] = [];

    if (item.selectedSize) {
      parts.push(`Size: ${item.selectedSize}`);
    }

    if (item.selectedColor && !item.selectedCombination) {
      parts.push(`Color: ${item.selectedColor}`);
    }

    if (item.selectedCombination) {
      parts.push(item.selectedCombination);
    }

    const packQuantity = Number(item.packQuantity || 1);

    if (item.selectedPack) {
      parts.push(packQuantity === 1 ? '1 Piece' : `${packQuantity} Pack`);
    }

    return parts.join(' • ');
  }

  getItemPrice(item: CartItem): number {
    return Number(item.cartPrice ?? item.price ?? 0);
  }

  toggleCart(): void {
    this.isCartOpen = !this.isCartOpen;
    this.updateScrollLock();
  }

  removeItem(item: CartItem): void {
    this.cartService.removeFromCart(item);
  }

  increase(item: CartItem): void {
    this.cartService.increaseQuantity(item);
  }

  decrease(item: CartItem): void {
    this.cartService.decreaseQuantity(item);
  }

  goToCheckout(): void {
    this.isCartOpen = false;
    this.updateScrollLock();
    this.cartService.clearBuyNow();
    this.router.navigate(['/checkout']);
  }

  // =====================================================
  // AUTH & USER MENU
  // =====================================================
  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  logout(): void {
    this.authService.logout();
    this.user = null;
    this.isUserMenuOpen = false;
    this.closeMenu();
    this.router.navigate(['/']);
  }

  getUserName(): string {
    return this.user?.name || '';
  }

  isAdmin(): boolean {
    return this.user?.role === 'admin';
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
    if (this.isUserMenuOpen) {
      this.isSearchOpen = false;
    }
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  // =====================================================
  // COMING SOON MODAL
  // =====================================================
  showComingSoon(section: string): void {
    this.comingSoonSection = section;
    this.showComingSoonModal = true;
    this.closeMenu();
  }

  closeComingSoon(): void {
    this.showComingSoonModal = false;
    this.comingSoonSection = '';
  }

  // =====================================================
  // CLOUDINARY THUMBNAIL OPTIMIZATION
  // =====================================================
  getImageUrl(image: string | undefined, width = 120): string {
    if (!image) {
      return 'assets/images/trianglepng.png';
    }
    if (!image.includes('res.cloudinary.com')) {
      return image;
    }
    return image.replace('/image/upload/', `/image/upload/f_auto,q_auto,w_${width}/`);
  }
}