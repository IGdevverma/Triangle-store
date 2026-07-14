import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {

  name = '';

  email = '';

  password = '';
  phone = '';

  confirmPassword = '';

  errorMessage = '';

  successMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  register() {

    if (this.password !== this.confirmPassword) {

      this.errorMessage = 'Passwords do not match';

      return;

    }

    this.authService.register({

      name: this.name,

      email: this.email,
      phone: this.phone,

      password: this.password

    }).subscribe({

      next: () => {

        this.successMessage = 'Registration successful';

        setTimeout(() => {

          this.router.navigate(['/login']);

        }, 1500);

      },

      error: (err) => {

        console.log("REGISTER ERROR:", err);

        alert(JSON.stringify(err));

        this.errorMessage =
          err.error?.message || 'Registration failed';

      }

    });

  }

}