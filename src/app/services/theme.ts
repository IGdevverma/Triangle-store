import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {

  private darkModeSubject = new BehaviorSubject<boolean>(false);

  darkMode$ = this.darkModeSubject.asObservable();

  constructor() {

    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'dark') {

      this.enableDarkMode();

    }

  }

  toggleTheme() {

    if (this.darkModeSubject.value) {

      this.disableDarkMode();

    } else {

      this.enableDarkMode();

    }

  }

  private enableDarkMode() {

    document.body.classList.add('dark-mode');

    localStorage.setItem('theme', 'dark');

    this.darkModeSubject.next(true);

  }

  private disableDarkMode() {

    document.body.classList.remove('dark-mode');

    localStorage.setItem('theme', 'light');

    this.darkModeSubject.next(false);

  }

}