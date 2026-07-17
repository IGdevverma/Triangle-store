import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class QuoteService {

  private http = inject(HttpClient);

  private api =
    'https://triangle-store-api.onrender.com/api/quotes';
    private getHeaders() {

      const token = localStorage.getItem('token');

      return {
        headers: new HttpHeaders({
          Authorization: `Bearer ${token}`
        })
      };

}

  // ==========================
  // Customer
  // ==========================

  submitQuote(data: any): Observable<any> {

    return this.http.post<any>(this.api, data);

  }

  // ==========================
  // Admin
  // ==========================

  getQuotes(): Observable<any> {
    return this.http.get<any>(this.api, this.getHeaders());
  }

  getQuote(id: string): Observable<any> {
    return this.http.get<any>(`${this.api}/${id}`, this.getHeaders());
  }

  updateQuoteStatus(id: string, status: string): Observable<any> {
    return this.http.put<any>(
      `${this.api}/${id}`,
      { status },
      this.getHeaders()
    );
  }

  deleteQuote(id: string): Observable<any> {
    return this.http.delete<any>(
      `${this.api}/${id}`,
      this.getHeaders()
    );
  }

}

