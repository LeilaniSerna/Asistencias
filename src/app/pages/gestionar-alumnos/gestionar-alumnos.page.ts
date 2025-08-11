import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonSpinner
} from '@ionic/angular/standalone';
import { AlumnosService, AlumnoDetalle } from '../../servicios/alumnos.service';

@Component({
  selector: 'app-gestionar-alumnos',
  templateUrl: './gestionar-alumnos.page.html',
  styleUrls: ['./gestionar-alumnos.page.scss'],
  standalone: true,
  imports: [
    
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonList,
    IonItem,
    IonLabel,
    IonSpinner,
    CommonModule,
    FormsModule,
  ],
})
export class GestionarAlumnosPage implements OnInit {
  alumnos: AlumnoDetalle[] = [];
  loading: boolean = false;

  constructor(private alumnosService: AlumnosService) {}

  ngOnInit() {
    this.cargarAlumnos();
  }

  cargarAlumnos() {
    this.loading = true;
    this.alumnosService.obtenerAlumnosDetalle().subscribe({
      next: (data: AlumnoDetalle[]) => {
        this.alumnos = data;
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error cargando alumnos', error);
        this.loading = false;
      }
    });
  }
}
