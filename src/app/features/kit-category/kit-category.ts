import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-kit-category',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './kit-category.html',
  styleUrl: './kit-category.css'
})
export class KitCategory {

  products = [
    {
      name: 'Club Shirt Short Sleeves',
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600',
      slug: 'club-shirt-short'
    },
    {
      name: 'Club Shirt Long Sleeves',
      image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600',
      slug: 'club-shirt-long'
    },
    {
      name: 'Club Trouser',
      image: 'https://images.unsplash.com/photo-1506629905607-d9c297d6d0fe?w=600',
      slug: 'club-trouser'
    },
    {
      name: 'Club Slipover',
      image: 'https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=600',
      slug: 'club-slipover'
    },
    {
      name: 'Club Sweater',
      image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600',
      slug: 'club-sweater'
    }
  ];

}