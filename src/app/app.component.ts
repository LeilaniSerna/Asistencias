import { Component } from '@angular/core';
import {
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonRouterOutlet,
  IonList,
  IonItem
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  imports: [
    IonMenu,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonRouterOutlet,
    IonList,
    IonItem
  ]
})
export class AppComponent {}
