import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit {

  user: any = null;

 constructor(
  private authService: AuthService,
  private router: Router
) {}

  ngOnInit(): void {

    this.user = this.authService.getUser();

  }

  logout() {

    this.authService.logout();
    this.router.navigate(['/']);
  }

}