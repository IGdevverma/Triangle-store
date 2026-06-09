import { Injectable } from '@angular/core';
import { Product } from '../models/product';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private apiUrl = 'http://localhost:3000/products';

  constructor(private http: HttpClient) { }

  getProducts(): Observable<Product[]> {

    return this.http.get<Product[]>(this.apiUrl);

  }
  getProductById(id: number): Observable<Product> {

    return this.http.get<Product>(

      `http://localhost:3000/products/${id}`

    );

  }

  addProduct(product: Product): Observable<Product> {

    return this.http.post<Product>(

      this.apiUrl,

      product

    );

  }

  updateProduct(

    id: number,

    product: Product

  ): Observable<Product> {

    return this.http.put<Product>(

      `${this.apiUrl}/${id}`,

      product

    );

  }

  deleteProduct(id: number): Observable<void> {

    return this.http.delete<void>(

      `${this.apiUrl}/${id}`

    );

  }

}