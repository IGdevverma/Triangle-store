import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Payment {

  private apiUrl =
    'https://triangle-store-api.onrender.com/api/payment';

  constructor(
    private http: HttpClient
  ) { }

  createOrder(amount: number): Observable<any> {

    return this.http.post(

      `${this.apiUrl}/create-order`,

      {

        amount

      }

    );

  }
  verifyPayment(data: any): Observable<any> {

    return this.http.post(

      `${this.apiUrl}/verify`,

      data

    );

  }

}