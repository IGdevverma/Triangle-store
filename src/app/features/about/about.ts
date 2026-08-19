import { Component, OnInit } from '@angular/core';
import { SeoService } from '../../services/seo';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [],
  templateUrl: './about.html',
  styleUrl: './about.css'
})
export class About implements OnInit {

  constructor(private seoService: SeoService) {}

  ngOnInit(): void {

    this.seoService.updateSeo(

      'About Us | Triangle Sports',

      'Learn about Triangle Sports, a premium sportswear manufacturer delivering high-quality activewear, gym wear, custom jerseys and team kits across India.',

      'About Triangle Sports,Sportswear Manufacturer,Gym Wear,Team Kits'

    );

  }

}