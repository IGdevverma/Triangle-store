import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class Payment {

  private apiUrl = `${environment.apiUrl}/payment`;

  constructor(
    private http: HttpClient
  ) { }

  createOrder(
    couponCode: string = '',
    items: any[] = []
  ): Observable<any> {

    return this.http.post(
      `${this.apiUrl}/create-order`,
      {
        couponCode,
        items
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