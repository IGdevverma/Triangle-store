import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';

import { Product } from '../models/product';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private readonly apiUrl =
    `${environment.apiUrl}/products`;

  private products$?: Observable<any>;

  constructor(
    private readonly http: HttpClient
  ) {}

  // ============================================================
  // GET ALL PRODUCTS
  // ============================================================

  getProducts(
    forceRefresh: boolean = false
  ): Observable<any> {

    if (forceRefresh || !this.products$) {

      this.products$ = this.http
        .get<any>(this.apiUrl)
        .pipe(
          shareReplay(1)
        );

    }

    return this.products$;
  }


  // ============================================================
  // GET SINGLE PRODUCT
  // ============================================================

  getProductById(
    id: string
  ): Observable<any> {

    return this.http.get<any>(
      `${this.apiUrl}/${id}`
    );
  }


  // ============================================================
  // GET RELATED PRODUCTS
  // ============================================================

  getRelatedProducts(
    productGroup: string,
    excludeId: string
  ): Observable<any> {

    const params = new HttpParams()
      .set('productGroup', productGroup)
      .set('excludeId', excludeId);

    return this.http.get<any>(
      `${this.apiUrl}/related`,
      { params }
    );
  }


  // ============================================================
  // ADD PRODUCT
  // ============================================================

  addProduct(
    product: FormData
  ): Observable<Product> {

    this.products$ = undefined;

    return this.http.post<Product>(
      this.apiUrl,
      product
    );
  }


  // ============================================================
  // UPDATE PRODUCT
  // ============================================================

  updateProduct(
    id: string,
    product: FormData
  ): Observable<any> {

    this.products$ = undefined;

    return this.http.put(
      `${this.apiUrl}/${id}`,
      product
    );
  }


  // ============================================================
  // DELETE PRODUCT
  // ============================================================

  deleteProduct(
    id: string
  ): Observable<void> {

    this.products$ = undefined;

    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );
  }

}