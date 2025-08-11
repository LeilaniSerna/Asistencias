import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-gestionar-materias',
  templateUrl: './gestionar-materias.page.html',
  styleUrls: ['./gestionar-materias.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class GestionarMateriasPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
