import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    CommonModule
  ],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css'
})
export class ForgotPassword {

  email = '';

  isLoading = false;
  isSent = false;

  message = '';
  errorMessage = '';

  constructor(
    private http: HttpClient
  ) {}

  submitForgotPassword(): void {

    this.message = '';
    this.errorMessage = '';

    const email = this.email.trim().toLowerCase();

    if (!email) {
      this.errorMessage =
        'Please enter your email address.';
      return;
    }

    this.isLoading = true;

    this.http.post<any>(
      `${environment.apiUrl}/auth/forgot-password`,
      { email }
    ).subscribe({

      next: () => {

        this.isLoading = false;

        this.isSent = true;

        this.message =
          'If an account exists with this email, a password reset link has been sent.';
      },

      error: (error) => {

        this.isLoading = false;

        this.errorMessage =
          error?.error?.message ||
          'Something went wrong. Please try again.';
      }

    });
  }
}