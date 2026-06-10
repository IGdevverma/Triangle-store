import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';

@Component({
  selector: 'app-request-quote',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './request-quote.html',
  styleUrl: './request-quote.css'
})
export class RequestQuote {

  quoteForm: FormGroup;

  submitted = false;

  constructor(private fb: FormBuilder) {

    this.quoteForm = this.fb.group({

      name: ['', Validators.required],

      company: [''],

      email: ['', [Validators.required, Validators.email]],

      phone: ['', Validators.required],

      product: ['', Validators.required],

      quantity: ['', Validators.required],

      message: ['']

    });

  }

  submitQuote() {

    if (this.quoteForm.valid) {

      const form = this.quoteForm.value;

      const message = `Hello Triangle Sports,

Name: ${form.name}
Company: ${form.company}
Email: ${form.email}
Phone: ${form.phone}
Product: ${form.product}
Quantity: ${form.quantity}

Requirements:
${form.message}`;

      const whatsappNumber = '916398235747';

      const url =
        `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

      window.open(url, '_blank');

      this.submitted = true;

      this.quoteForm.reset();

    }

  }

}