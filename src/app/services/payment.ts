import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders
} from '@angular/common/http';

import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class Payment {

  private readonly apiUrl =
    `${environment.apiUrl}/payment`;

  constructor(
    private readonly http: HttpClient
  ) {}


  // ==========================================================
  // CREATE RAZORPAY ORDER
  // ==========================================================

  createOrder(
    couponCode: string = '',
    items: any[] = [],
    guestVerificationToken?: string | null
  ): Observable<any> {

    const headers =
      this.buildGuestHeaders(
        guestVerificationToken
      );

    return this.http.post<any>(
      `${this.apiUrl}/create-order`,
      {
        couponCode,
        items
      },
      {
        headers
      }
    );
  }


  // ==========================================================
  // VERIFY RAZORPAY PAYMENT
  // ==========================================================

  verifyPayment(
    data: any,
    guestVerificationToken?: string | null
  ): Observable<any> {

    const headers =
      this.buildGuestHeaders(
        guestVerificationToken
      );

    return this.http.post<any>(
      `${this.apiUrl}/verify`,
      data,
      {
        headers
      }
    );
  }


  // ==========================================================
  // GUEST VERIFICATION HEADER
  // ==========================================================

  private buildGuestHeaders(
    guestVerificationToken?: string | null
  ): HttpHeaders {

    let headers =
      new HttpHeaders();

    if (
      guestVerificationToken &&
      guestVerificationToken.trim()
    ) {

      headers =
        headers.set(
          'X-Guest-Verification-Token',
          guestVerificationToken.trim()
        );
    }

    return headers;
  }

}