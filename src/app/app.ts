import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';

import { NgxSpinnerComponent } from 'ngx-spinner';
import { Notification } from './shared/notification/notification';

import { Header } from './layouts/header/header';
import { Footer } from './layouts/footer/footer';
import { LoadingSpinner } from './shared/loading-spinner/loading-spinner';

@Component({
  selector: 'app-root',

  standalone: true,

  imports: [
    CommonModule,
    RouterOutlet,
    Header,
    Footer,
    Notification,
    LoadingSpinner,
    NgxSpinnerComponent
  ],

  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {

  protected readonly title = signal('sportswear-store');

  constructor(public router: Router) {}

  /**
   * Routes where the main website layout
   * should NOT be displayed.
   */
  isAdminRoute(): boolean {
    return this.router.url.startsWith('/admin');
  }

  isAuthRoute(): boolean {
    return (
      this.router.url.startsWith('/login') ||
      this.router.url.startsWith('/register')
    );
  }

  /**
   * Header + Footer should only appear
   * on normal website pages.
   */
  showMainLayout(): boolean {
    return !this.isAdminRoute() && !this.isAuthRoute();
  }
}