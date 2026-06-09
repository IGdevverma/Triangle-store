import { Component } from '@angular/core';
import { RouterLink } from "@angular/router";
import { CartService } from "../../services/cart";
import { CartItem } from '../../services/cart';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  cartCount = 0;

  constructor(private cartService: CartService) {

    this.cartService.cart$.subscribe(items => {

      this.cartCount = items.reduce(

        (total, item) => total + item.quantity,

        0

      );

    });

  }


}
