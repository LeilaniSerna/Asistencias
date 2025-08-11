import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-gestionar-profesores',
  templateUrl: './gestionar-profesores.page.html',
  styleUrls: ['./gestionar-profesores.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class GestionarProfesoresPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
