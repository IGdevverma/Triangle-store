import { Injectable } from '@angular/core';
import { Product } from '../models/product';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private apiUrl = 'http://localhost:8000/api/products';

  constructor(private http: HttpClient) { }

  getProducts(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }
  getProductById(id: string): Observable<any> {

    return this.http.get<any>(
      `${this.apiUrl}/${id}`
    );

  }

  addProduct(product: FormData): Observable<Product> {

    return this.http.post<Product>(

      this.apiUrl,

      product

    );

  }

  updateProduct(

    id: string,

    product: Product

  ): Observable<Product> {

    return this.http.put<Product>(

      `${this.apiUrl}/${id}`,

      product

    );

  }

  deleteProduct(id: string): Observable<void> {

    return this.http.delete<void>(

      `${this.apiUrl}/${id}`

    );

  }

}