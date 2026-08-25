import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  email = '';
  password = '';

  errorMessage = '';
  successMessage = '';

  showPassword = false;
  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  login() {

    this.errorMessage = '';
    this.successMessage = '';

    if (!this.email || !this.password) {

      this.errorMessage =
        'Please enter email and password';

      return;
    }

    this.authService.login({

      email: this.email,
      password: this.password

    }).subscribe({

      next: (response) => {

        console.log('Login successful:', response);

        // Save JWT token
        localStorage.setItem(
          'token',
          response.token
        );

        // Save user
        localStorage.setItem(
          'user',
          JSON.stringify(response.user)
        );

        // Admin / User redirect
        if (response.user.role === 'admin') {

          this.router.navigate(['/admin']);

        } else {

          this.router.navigate(['/shop']);

        }

      },

      error: (error) => {

        console.error('Login error:', error);

        this.errorMessage =
          error?.error?.message ||
          'Invalid email or password';

      }

    });

  }

}