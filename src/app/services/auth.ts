import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly ADMIN_EMAIL = 'admin@tyka.com';

  private readonly ADMIN_PASSWORD = '123456';

  login(email: string, password: string): boolean {

    if (
      email === this.ADMIN_EMAIL &&
      password === this.ADMIN_PASSWORD
    ) {

      localStorage.setItem('isLoggedIn', 'true');

      return true;

    }

    return false;
  }

  logout() {

    localStorage.removeItem('isLoggedIn');

  }

  isLoggedIn(): boolean {

    return localStorage.getItem('isLoggedIn') === 'true';

  }

}