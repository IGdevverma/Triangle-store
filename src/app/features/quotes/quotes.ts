import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { FormsModule } from '@angular/forms';

import { QuoteService } from '../../services/quote';

@Component({
  selector: 'app-quotes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './quotes.html',
  styleUrl: './quotes.css'
})
export class Quotes implements OnInit {

  quotes: any[] = [];
  statusFilter = '';
  loading = false;
  selectedQuote: any = null;
  searchText = '';
  showQuoteModal = false;
  filteredQuotes: any[] = [];

  loadingQuote = false;

  constructor(private quoteService: QuoteService) { }

  ngOnInit(): void {

    this.loadQuotes();

  }

  loadQuotes() {

    this.loading = true;

    this.quoteService.getQuotes().subscribe({

      next: (res) => {

        this.quotes = res.quotes;
        this.filteredQuotes = [...this.quotes];
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
  viewQuote(id: string) {

    this.loadingQuote = true;

    this.quoteService.getQuote(id).subscribe({

      next: (res) => {
        console.log("Quote Response:", res);

        this.selectedQuote = res.quote;

        this.showQuoteModal = true;

        this.loadingQuote = false;

      },

      error: () => {

        this.loadingQuote = false;

        Swal.fire(
          'Error',
          'Unable to load quote.',
          'error'
        );

      }

    });

  }
  updateStatus() {

    this.quoteService
      .updateQuoteStatus(
        this.selectedQuote._id,
        this.selectedQuote.status
      )
      .subscribe({

        next: () => {

          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Quote updated successfully'
          });

          this.showQuoteModal = false;

          this.loadQuotes();

        },

        error: (err) => {

          console.log("UPDATE ERROR", err);

          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err.error?.message || 'Unable to update quote.'
          });

        }

      });

  }
  applyFilters() {

    const search = this.searchText.trim().toLowerCase();

    this.filteredQuotes = this.quotes.filter(q => {

      const matchesSearch =
        q.name?.toLowerCase().includes(search) ||
        q.company?.toLowerCase().includes(search) ||
        q.email?.toLowerCase().includes(search) ||
        q.phone?.toString().includes(search);

      const matchesStatus =
        !this.statusFilter || q.status === this.statusFilter;

      return matchesSearch && matchesStatus;

    });

  }

  deleteQuote(id: string) {

    Swal.fire({

      title: 'Delete Quote?',

      text: 'This action cannot be undone.',

      icon: 'warning',

      showCancelButton: true,

      confirmButtonColor: '#d33',

      confirmButtonText: 'Delete'

    }).then((result) => {

      if (result.isConfirmed) {

        this.quoteService.deleteQuote(id).subscribe({

          next: () => {

            Swal.fire(
              'Deleted!',
              'Quote deleted successfully.',
              'success'
            );

            this.showQuoteModal = false;

            this.loadQuotes();

          },

          error: () => {

            Swal.fire(
              'Error',
              'Unable to delete quote.',
              'error'
            );

          }

        });

      }

    });

  }

}