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

  // Manufacturing Quote Form
  quoteForm: FormGroup;

  submitted = false;

  // Dealer Form
  dealerForm: FormGroup;

  dealerSubmitted = false;

  constructor(private fb: FormBuilder) {

    // Quote Form
    this.quoteForm = this.fb.group({

      name: ['', Validators.required],

      company: [''],

      email: ['', [
        Validators.required,
        Validators.email
      ]],

      phone: ['', Validators.required],

      product: ['', Validators.required],

      quantity: ['', Validators.required],

      message: ['']

    });

    // Dealer Form
    this.dealerForm = this.fb.group({

      fullName: ['', Validators.required],

      businessName: ['', Validators.required],

      email: [
        '',
        [
          Validators.required,
          Validators.email
        ]
      ],

      phone: ['', Validators.required],

      city: ['', Validators.required],

      state: ['', Validators.required],

      experience: [''],

      message: ['']

    });

  }

  // Manufacturing Quote
  submitQuote() {

    if (this.quoteForm.valid) {

      const form = this.quoteForm.value;

      const whatsappMessage = `Hello Triangle Sports,

Manufacturing Enquiry

Name: ${form.name}
Company: ${form.company}
Email: ${form.email}
Phone: ${form.phone}
Product: ${form.product}
Quantity: ${form.quantity}

Requirements:
${form.message}`;

      const url =
        `https://wa.me/916398235747?text=${encodeURIComponent(whatsappMessage)}`;

      window.open(url, '_blank');

      this.submitted = true;

      this.quoteForm.reset();

    }

  }

  // Dealer Registration
  submitDealer() {

    if (this.dealerForm.valid) {

      const form = this.dealerForm.value;

      const whatsappMessage = `Hello Triangle Sports,

Dealer Registration Request

Name: ${form.fullName}
Business: ${form.businessName}
Email: ${form.email}
Phone: ${form.phone}
City: ${form.city}
State: ${form.state}

Experience:
${form.experience}

Message:
${form.message}`;

      const url =
        `https://wa.me/916398235747?text=${encodeURIComponent(whatsappMessage)}`;

      window.open(url, '_blank');

      this.dealerSubmitted = true;

      this.dealerForm.reset();

    }

  }
  activeFaq: number | null = null;
  brands = [

    {
      name: 'Tata 1mg',
      type: 'Corporate Healthcare'
    },

    {
      name: 'AJIO',
      type: 'Fashion & Retail'
    },

    {
      name: 'O.P. Jindal Global University',
      type: 'Educational Institution'
    },

    {
      name: 'IIT Roorkee',
      type: 'Educational Institution'
    }

  ];

  toggleFaq(index: number) {

    if (this.activeFaq === index) {

      this.activeFaq = null;

    } else {

      this.activeFaq = index;

    }

  }

}