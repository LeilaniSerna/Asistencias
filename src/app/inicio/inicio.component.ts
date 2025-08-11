import { Component } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonMenuButton,
  IonMenu,
  IonList,
  IonItem
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-inicio',
  standalone: true,
  templateUrl: './inicio.component.html',
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonMenuButton,
    IonMenu,
    IonList,
    IonItem
  ]
})
export class InicioComponent {}