import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

import { QuoteService } from '../../services/quote';

@Component({
  selector: 'app-quotes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quotes.html',
  styleUrl: './quotes.css'
})
export class Quotes implements OnInit {

  quotes: any[] = [];

  loading = false;

  constructor(private quoteService: QuoteService) {}

  ngOnInit(): void {

    this.loadQuotes();

  }

  loadQuotes() {

    this.loading = true;

    this.quoteService.getQuotes().subscribe({

      next: (res) => {

        this.quotes = res.quotes;

        this.loading = false;

      },

      error: () => {

        this.loading = false;

        Swal.fire(
          'Error',
          'Unable to load quotes.',
          'error'
        );

      }

    });

  }

}