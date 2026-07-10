import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  email = '';

  password = '';

  errorMessage = '';
  showPassword = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }



  login() {

    this.authService.login({

      email: this.email,

      password: this.password

    }).subscribe({

      next: (response) => {

        if (response.user.role === 'admin') {

          this.router.navigate(['/admin']);

        } else {

          this.router.navigate(['/shop']);

        }

      },

      error: () => {

        this.errorMessage =
          'Invalid email or password';

      }

    });

  }



}