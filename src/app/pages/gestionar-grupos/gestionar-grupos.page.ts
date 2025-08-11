import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-gestionar-grupos',
  templateUrl: './gestionar-grupos.page.html',
  styleUrls: ['./gestionar-grupos.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class GestionarGruposPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
