import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Router,
  RouterLink
} from '@angular/router';

import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {

  // ==========================================
  // FORM FIELDS
  // ==========================================

  name = '';

  email = '';

  phone = '';

  password = '';

  confirmPassword = '';


  // ==========================================
  // UI STATE
  // ==========================================

  errorMessage = '';

  successMessage = '';

  isLoading = false;


  // ==========================================
  // CONSTRUCTOR
  // ==========================================

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }


  // ==========================================
  // PHONE INPUT
  // ==========================================

  onPhoneInput(event: Event): void {

    const input =
      event.target as HTMLInputElement;

    // Allow numbers only
    this.phone = input.value
      .replace(/\D/g, '')
      .slice(0, 10);

  }


  // ==========================================
  // REGISTER
  // ==========================================

  register(): void {

    // Clear previous messages
    this.errorMessage = '';

    this.successMessage = '';


    // Prevent duplicate requests
    if (this.isLoading) {
      return;
    }


    // ========================================
    // VALIDATE NAME
    // ========================================

    const name =
      this.name.trim();

    if (!name) {

      this.errorMessage =
        'Please enter your full name.';

      return;

    }


    // ========================================
    // VALIDATE EMAIL
    // ========================================

    const email =
      this.email.trim().toLowerCase();

    if (!email) {

      this.errorMessage =
        'Please enter your email address.';

      return;

    }


    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {

      this.errorMessage =
        'Please enter a valid email address.';

      return;

    }


    // ========================================
    // VALIDATE PHONE
    // ========================================

    const phone =
      this.phone.trim();

    if (!phone) {

      this.errorMessage =
        'Please enter your phone number.';

      return;

    }


    if (!/^[6-9]\d{9}$/.test(phone)) {

      this.errorMessage =
        'Please enter a valid 10-digit phone number.';

      return;

    }


    // ========================================
    // VALIDATE PASSWORD
    // ========================================

    if (!this.password) {

      this.errorMessage =
        'Please enter a password.';

      return;

    }


    if (this.password.length < 6) {

      this.errorMessage =
        'Password must be at least 6 characters.';

      return;

    }


    // ========================================
    // CONFIRM PASSWORD
    // ========================================

    if (!this.confirmPassword) {

      this.errorMessage =
        'Please confirm your password.';

      return;

    }


    if (
      this.password !==
      this.confirmPassword
    ) {

      this.errorMessage =
        'Passwords do not match.';

      return;

    }


    // ========================================
    // START REQUEST
    // ========================================

    this.isLoading = true;


    // ========================================
    // REGISTER PAYLOAD
    // ========================================

    const userData = {
      name,
      email,
      phone,
      password: this.password
    };


    console.log(
      'REGISTER REQUEST:',
      {
        name,
        email,
        phone
      }
    );


    // ========================================
    // API REQUEST
    // ========================================

    this.authService
      .register(userData)
      .subscribe({

        // ====================================
        // SUCCESS
        // ====================================

        next: (response) => {

          console.log(
            'REGISTER SUCCESS:',
            response
          );

          this.isLoading = false;

          this.successMessage =
            'Registration successful! Redirecting to login...';


          // Clear form
          this.name = '';

          this.email = '';

          this.phone = '';

          this.password = '';

          this.confirmPassword = '';


          // Redirect
          setTimeout(() => {

            this.router.navigate([
              '/login'
            ]);

          }, 1500);

        },


        // ====================================
        // ERROR
        // ====================================

        error: (error) => {

          console.error(
            'REGISTER ERROR:',
            error
          );

          this.isLoading = false;


          // Backend message
          const message =
            error?.error?.message;


          if (message) {

            this.errorMessage =
              message;

            return;

          }


          // Common HTTP errors
          if (error?.status === 409) {

            this.errorMessage =
              'An account with this email already exists.';

            return;

          }


          if (error?.status === 400) {

            this.errorMessage =
              'Please check your registration details.';

            return;

          }


          if (error?.status === 0) {

            this.errorMessage =
              'Unable to connect to the server. Please try again.';

            return;

          }


          this.errorMessage =
            'Registration failed. Please try again.';

        }

      });

  }

}