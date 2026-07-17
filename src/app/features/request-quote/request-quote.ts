import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { QuoteService } from '../../services/quote';
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
  loading = false;
  submitted = false;

  // Dealer Form
  dealerForm: FormGroup;

  dealerSubmitted = false;

  constructor(

    private fb: FormBuilder,

    private quoteService: QuoteService

  ) {

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

    if (this.quoteForm.invalid) {

      this.quoteForm.markAllAsTouched();

      return;

    }

    this.loading = true;

    const form = this.quoteForm.value;

    const payload = {

      name: form.name,

      company: form.company,

      email: form.email,

      phone: form.phone,

      product: form.product,

      quantity: form.quantity,

      requirements: form.message

    };

    this.quoteService.submitQuote(payload).subscribe({

      next: (res) => {

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

        window.open(

          `https://wa.me/919990180409?text=${encodeURIComponent(whatsappMessage)}`,

          '_blank'

        );

        Swal.fire({

          icon: 'success',

          title: 'Quote Submitted',

          text: 'Our sales team will contact you shortly.',

          confirmButtonColor: '#7c3aed'

        });

        this.quoteForm.reset();

        this.submitted = true;

        this.loading = false;

      },

      error: () => {

        this.loading = false;

        Swal.fire({

          icon: 'error',

          title: 'Submission Failed',

          text: 'Please try again later.'

        });

      }

    });
    

  }
    // ======================================
  // Dealer Registration
  // ======================================

  submitDealer() {

    if (this.dealerForm.invalid) {

      this.dealerForm.markAllAsTouched();

      return;

    }

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

    window.open(
      `https://wa.me/916398235747?text=${encodeURIComponent(whatsappMessage)}`,
      '_blank'
    );

    Swal.fire({

      icon: 'success',

      title: 'Dealer Request Submitted',

      text: 'Our team will contact you shortly.',

      confirmButtonColor: '#7c3aed'

    });

    this.dealerSubmitted = true;

    this.dealerForm.reset();

  }


  // ======================================
  // FAQ
  // ======================================

  activeFaq: number | null = null;

  toggleFaq(index: number) {

    this.activeFaq = this.activeFaq === index ? null : index;

  }


  // ======================================
  // Trusted Brands
  // ======================================

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
}