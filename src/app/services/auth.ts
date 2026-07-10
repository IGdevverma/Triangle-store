import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'http://localhost:8000/api/auth';

  constructor(private http: HttpClient) { }

  login(data: { email: string; password: string }): Observable<any> {

    return this.http.post<any>(`${this.apiUrl}/login`, data).pipe(

      tap((response) => {

        localStorage.setItem('token', response.token);

        localStorage.setItem(
          'user',
          JSON.stringify(response.user)
        );

      })

    );

  }

  register(data: any): Observable<any> {

    return this.http.post<any>(
      `${this.apiUrl}/register`,
      data
    );

  }

  logout() {

    localStorage.removeItem('token');
    localStorage.removeItem('user');

  }

  isLoggedIn(): boolean {

    return !!localStorage.getItem('token');

  }

  getUser() {

    const user = localStorage.getItem('user');

    return user ? JSON.parse(user) : null;

  }

  updateProfile(data: any): Observable<any> {

    const token = localStorage.getItem('token');

    const headers = new HttpHeaders({

      Authorization: `Bearer ${token}`

    });

    return this.http.put<any>(

      `${this.apiUrl}/profile`,

      data,

      { headers }

    ).pipe(

      tap((response) => {

        localStorage.setItem(

          'user',

          JSON.stringify(response.user)

        );

      })

    );

  }

}