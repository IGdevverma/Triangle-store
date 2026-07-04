import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-team-kit-customize',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './team-kit-customize.html',
  styleUrl: './team-kit-customize.css'
})
export class TeamKitCustomize {

  /* Front / Back Toggle */
  showBack = false;

  /* Jersey Images */
  frontImage = 'assets/kits/cricket-front.jpeg';
  backImage = 'assets/kits/cricket-back.jpeg';

  /* Colours */
  primaryColor = '#ffffff';
  secondaryColor = '#000000';

  /* Player Details */
  teamName = 'TRIANGLE';
  playerName = 'DEV';
  playerNumber = '18';

  /* Collar */
  collarStyle = 'V Neck';

  /* Logo */
  logoUrl: string = '';

  /* Manufacturing */
  quantity = 50;

  uploadLogo(event: Event): void {

    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    const reader = new FileReader();

    reader.onload = () => {
      this.logoUrl = reader.result as string;
    };

    reader.readAsDataURL(file);
  }

  /* Quote */

  get pricePerPiece(): number {
    return 450;
  }

  get totalPrice(): number {
    return this.quantity * this.pricePerPiece;
  }

}