import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Order } from '../models/orders';

@Injectable({
  providedIn: 'root'
})
export class OrderService {




  private apiUrl =
    'https://triangle-store-api.onrender.com/api/orders';

  constructor(private http: HttpClient) { }

  addOrder(order: Order): Observable<any> {

    return this.http.post<any>(
      this.apiUrl,
      order
    );

  }

  getOrders(): Observable<any> {

    return this.http.get<any>(
      this.apiUrl
    );

  }
  updateOrderStatus(orderId: string, status: string): Observable<any> {

    return this.http.put(

      `${this.apiUrl}/${orderId}`,

      {
        orderStatus: status
      }

    );

  }

  getOrderById(id: string): Observable<any> {

    return this.http.get<any>(
      `${this.apiUrl}/${id}`
    );

  }

}