import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class QuoteService {

  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/quotes`;
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

    return this.http.post<any>(this.apiUrl, data);

  }

  // ==========================
  // Admin
  // ==========================

  getQuotes(): Observable<any> {
    return this.http.get<any>(this.apiUrl, this.getHeaders());
  }

  getQuote(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, this.getHeaders());
  }

  updateQuoteStatus(id: string, status: string): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/${id}`,
      { status },
      this.getHeaders()
    );
  }

  deleteQuote(id: string): Observable<any> {
    return this.http.delete<any>(
      `${this.apiUrl}/${id}`,
      this.getHeaders()
    );
  }

}

