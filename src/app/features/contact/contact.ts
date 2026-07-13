import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './contact.html',
  styleUrl: './contact.css'
})
export class Contact {

  contact = {

    name: '',

    email: '',

    phone: '',

    message: ''

  };

  sendMessage() {

    console.log(this.contact);

    alert('Thank you! We will contact you shortly.');

    this.contact = {

      name: '',

      email: '',

      phone: '',

      message: ''

    };

  }

}