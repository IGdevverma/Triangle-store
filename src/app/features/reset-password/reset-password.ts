import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css'
})
export class ResetPassword implements OnInit {

  token = '';

  password = '';
  confirmPassword = '';

  isLoading = false;

  message = '';
  errorMessage = '';

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {

    this.token =
      this.route.snapshot.paramMap.get('token') || '';

    if (!this.token) {
      this.errorMessage =
        'Invalid or missing password reset link.';
    }
  }

  submitResetPassword(): void {

    this.message = '';
    this.errorMessage = '';

    // ------------------------------------------
    // Token validation
    // ------------------------------------------

    if (!this.token) {
      this.errorMessage =
        'Invalid or missing password reset link.';
      return;
    }

    // ------------------------------------------
    // Password validation
    // ------------------------------------------

    if (!this.password) {
      this.errorMessage =
        'Please enter a new password.';
      return;
    }

    if (this.password.length < 8) {
      this.errorMessage =
        'Password must be at least 8 characters long.';
      return;
    }

    if (this.password.length > 72) {
      this.errorMessage =
        'Password cannot exceed 72 characters.';
      return;
    }

    // ------------------------------------------
    // Confirm password
    // ------------------------------------------

    if (this.password !== this.confirmPassword) {
      this.errorMessage =
        'Passwords do not match.';
      return;
    }

    // ------------------------------------------
    // API request
    // ------------------------------------------

    this.isLoading = true;

    this.http.put<any>(
      `${environment.apiUrl}/auth/reset-password/${encodeURIComponent(this.token)}`,
      {
        password: this.password
      }
    ).subscribe({

      next: (response) => {

        this.isLoading = false;

        this.message =
          response?.message ||
          'Password reset successful.';

        // Clear password fields
        this.password = '';
        this.confirmPassword = '';

        // Redirect to login after a short delay
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },

      error: (error) => {

        this.isLoading = false;

        this.errorMessage =
          error?.error?.message ||
          'Password reset failed. Please try again.';
      }

    });
  }
}