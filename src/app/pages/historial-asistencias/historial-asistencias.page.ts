import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-historial-asistencias',
  templateUrl: './historial-asistencias.page.html',
  styleUrls: ['./historial-asistencias.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class HistorialAsistenciasPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
