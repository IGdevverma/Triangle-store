import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-team-kit-designer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './team-kit-designer.html',
  styleUrl: './team-kit-designer.css'
})
export class TeamKitDesigner {

  categories = [
    { name: 'Sublimated 2.0', slug: 'sublimated' },
    { name: 'Football', slug: 'football' },
    { name: 'Basketball', slug: 'basketball' },
    { name: 'Hockey', slug: 'hockey' },
    { name: 'Cricket Whites', slug: 'cricket' },
    { name: 'Training', slug: 'training' },
    { name: 'Leisure', slug: 'leisure' }
  ];

  kits = [

    {

      name: 'Sublimated 2.0',

      slug: 'sublimated',

      image: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=600'

    },

    {

      name: 'Football',

      slug: 'football',

      image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600'

    },

    {

      name: 'Basketball',

      slug: 'basketball',

      image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600'

    },

    {

      name: 'Hockey',

      slug: 'hockey',

      image: 'https://images.unsplash.com/photo-1511886929837-354d827aae26?w=600'

    },

    {

      name: 'Cricket Whites',

      slug: 'cricket',

      image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=600'

    },

    {

      name: 'Training',

      slug: 'training',

      image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600'

    }

  ];



}