import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { Order } from '../models/orders';


// ======================================================
// API RESPONSE TYPES
// ======================================================

export interface OrdersResponse {
  success: boolean;
  orders: Order[];
}

export interface OrderResponse {
  success: boolean;
  message?: string;
  order: Order;
}

export interface UpdateOrderStatusRequest {
  orderStatus:
    | 'Processing'
    | 'Packed'
    | 'Shipped'
    | 'Delivered'
    | 'Cancelled';

  cancellationReason?: string;
}


// ======================================================
// ORDER SERVICE
// ======================================================

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  private readonly apiUrl =
    `${environment.apiUrl}/orders`;


  constructor(
    private readonly http: HttpClient
  ) {}


  // ====================================================
  // CREATE ORDER
  // ====================================================

  addOrder(
    order: Order
  ): Observable<OrderResponse> {

    return this.http.post<OrderResponse>(
      this.apiUrl,
      order
    );

  }


  // ====================================================
  // GET USER ORDERS
  // ====================================================

  getOrders(): Observable<OrdersResponse> {

    return this.http.get<OrdersResponse>(
      this.apiUrl
    );

  }


  // ====================================================
  // GET SINGLE ORDER
  // ====================================================

  getOrderById(
    orderId: string
  ): Observable<OrderResponse> {

    return this.http.get<OrderResponse>(
      `${this.apiUrl}/${orderId}`
    );

  }


  // ====================================================
  // UPDATE ORDER STATUS
  // ====================================================

  updateOrderStatus(
    orderId: string,
    status:
      | 'Processing'
      | 'Packed'
      | 'Shipped'
      | 'Delivered'
      | 'Cancelled',
    cancellationReason?: string
  ): Observable<OrderResponse> {


    const body: UpdateOrderStatusRequest = {
      orderStatus: status
    };


    // Cancellation reason only required
    // when cancelling an order.

    if (
      status === 'Cancelled' &&
      cancellationReason?.trim()
    ) {

      body.cancellationReason =
        cancellationReason.trim();

    }


    return this.http.put<OrderResponse>(
      `${this.apiUrl}/${orderId}`,
      body
    );

  }

}