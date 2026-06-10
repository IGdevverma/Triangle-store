import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Notification } from './shared/notification/notification';
import { Header } from './layouts/header/header';
import { Footer } from './layouts/footer/footer';
import { LoadingSpinner } from './shared/loading-spinner/loading-spinner';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    Header,
    Footer,
    Notification,
    LoadingSpinner
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('sportswear-store');
}