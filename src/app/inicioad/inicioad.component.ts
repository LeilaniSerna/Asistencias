import { Component } from '@angular/core';
import {
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
} from '@ionic/angular/standalone';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-inicioad',
  templateUrl: './inicioad.component.html',
  styleUrls: ['./inicioad.component.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    RouterLink
  ],
})
export class InicioadComponent {
  constructor(private router: Router) {}

  navegar(ruta: string) {
    this.router.navigate([ruta]);
  }
}
