import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

@Component({
  selector: 'app-dealer-registration',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dealer-registration.html',
  styleUrl: './dealer-registration.css'
})
export class DealerRegistration {

  dealerForm: FormGroup;

  submitted = false;

  constructor(private fb: FormBuilder) {

    this.dealerForm = this.fb.group({

      fullName: ['', Validators.required],

      businessName: ['', Validators.required],

      email: ['', [
        Validators.required,
        Validators.email
      ]],

      phone: ['', Validators.required],

      city: ['', Validators.required],

      state: ['', Validators.required],

      experience: [''],

      message: ['']

    });

  }

  submitApplication() {

    if (this.dealerForm.valid) {

      console.log(this.dealerForm.value);

      this.submitted = true;

      this.dealerForm.reset();

    }

  }

}