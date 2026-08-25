import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],

  templateUrl: './footer.html',
  styleUrl: './footer.css'
})
export class Footer {

  // =====================================================
  // NEWSLETTER
  // =====================================================

  subscriberEmail = '';

  isSubscribing = false;

  subscribeSuccess = '';

  subscribeError = '';


  // =====================================================
  // SUBSCRIBE
  // =====================================================

  subscribe(): void {

    // Clear previous messages
    this.subscribeSuccess = '';
    this.subscribeError = '';


    // Clean email
    const email =
      this.subscriberEmail
        .trim()
        .toLowerCase();


    // ===================================================
    // VALIDATE EMAIL
    // ===================================================

    if (!email) {

      this.subscribeError =
        'Please enter your email address.';

      return;
    }


    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (!emailPattern.test(email)) {

      this.subscribeError =
        'Please enter a valid email address.';

      return;
    }


    // Prevent duplicate clicks
    if (this.isSubscribing) {
      return;
    }


    // ===================================================
    // START SUBMISSION
    // ===================================================

    this.isSubscribing = true;


    /*
      Temporary frontend implementation.

      Later we will replace this with:

      this.newsletterService.subscribe(email)

      and save the subscriber in MongoDB.
    */

    setTimeout(() => {

      this.isSubscribing = false;

      this.subscribeSuccess =
        'You’re subscribed! Welcome to Triangle Sports.';

      this.subscriberEmail = '';

    }, 800);
  }

}