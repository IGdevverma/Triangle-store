import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WishlistService } from '../../services/wishlist';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {

  completedOrders = 0;
  pendingOrders = 0;
  wishlistCount = 0;
  recentOrders = [

    {
      id: 'TS1001',
      date: '10 Jul 2026',
      status: 'Delivered',
      amount: 999
    },

    {
      id: 'TS1002',
      date: '09 Jul 2026',
      status: 'Processing',
      amount: 1499
    },

    {
      id: 'TS1003',
      date: '08 Jul 2026',
      status: 'Pending',
      amount: 799
    }

  ];

  constructor(
    private wishlistService: WishlistService
  ) { }

  ngOnInit(): void {

    // Wishlist Count
    this.wishlistService.wishlist$.subscribe(items => {
      this.wishlistCount = items.length;
    });

    // Temporary data
    this.completedOrders = 0;
    this.pendingOrders = 0;
  }

}