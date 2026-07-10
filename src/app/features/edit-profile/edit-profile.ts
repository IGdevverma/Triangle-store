import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './edit-profile.html',
  styleUrl: './edit-profile.css'
})
export class EditProfile implements OnInit {

  profileForm!: FormGroup;

  user: any;

  constructor(

    private fb: FormBuilder,

    private authService: AuthService

  ) { }

  ngOnInit(): void {

    this.user = this.authService.getUser();

    this.profileForm = this.fb.group({

      name: [

        this.user?.name,

        [Validators.required]

      ],

      email: [

        {
          value: this.user?.email,
          disabled: true
        },

        [Validators.required, Validators.email]

      ],

      phone: [

        this.user?.phone || ''

      ],

      gender: [

        this.user?.gender || 'Male'

      ]

    });

  }

  saveProfile() {

    if (this.profileForm.invalid) {

      this.profileForm.markAllAsTouched();

      return;

    }

    this.authService.updateProfile(this.profileForm.value)

      .subscribe({

        next: (response) => {

          this.user = response.user;

          alert("Profile updated successfully!");

        },

        error: (error) => {

          console.error(error);

          alert("Failed to update profile!");

        }

      });

  }

}