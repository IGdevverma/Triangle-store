import { Injectable } from '@angular/core';
import { Product } from '../models/product';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private apiUrl = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) { }

  private products$?: Observable<any>;

  getProducts(): Observable<any> {

    if (!this.products$) {
      this.products$ = this.http
        .get<any>(this.apiUrl)
        .pipe(
          shareReplay(1)
        );
    }

    return this.products$;
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

  updateProduct(id: string, product: FormData) {
    return this.http.put(
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