import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonItem,
  IonLabel,
  IonIcon,
  IonButtons,
  IonBackButton
} from '@ionic/angular/standalone';
import { MateriasProfesorService } from 'src/app/servicios/materias-profesor.service';
import { addIcons } from 'ionicons';
import { listOutline, createOutline, chevronDownOutline, chevronUpOutline } from 'ionicons/icons';

addIcons({ listOutline, createOutline, chevronDownOutline, chevronUpOutline });

@Component({
  selector: 'app-materias-profesor',
  templateUrl: './materias-profesor.page.html',
  styleUrls: ['./materias-profesor.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader,
    IonCardTitle, IonButton, IonItem, IonLabel, IonIcon, IonButtons, IonBackButton,
    CommonModule, FormsModule
  ]
})
export class MateriasProfesorPage implements OnInit {
  grupoId: number | null = null;
  materias: any[] = []; 
  grupoNombre: string = '';
  materiaExpandida: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private materiasService: MateriasProfesorService
  ) {}

  ngOnInit() {
    this.grupoId = Number(this.route.snapshot.paramMap.get('grupoId'));
    this.grupoNombre = this.route.snapshot.queryParamMap.get('grupoNombre') || '';

    const user = localStorage.getItem('user');
    if (user) {
      const parsedUser = JSON.parse(user);
      const profesorId = parsedUser.id;

      if (this.grupoId && profesorId) {
        this.materiasService.obtenerMaterias(profesorId, this.grupoId).subscribe({
          next: (data) => {
            const agrupadas: any = {};
            
            data.forEach((item: any) => {
              if (!agrupadas[item.nombre]) {
                agrupadas[item.nombre] = {
                  nombre: item.nombre,
                  horarios: []
                };
              }
              // Guardamos ID y Texto para usarlos en los botones
              agrupadas[item.nombre].horarios.push({
                id: item.clase_id,     
                texto: item.horario    
              });
            });
            
            this.materias = Object.values(agrupadas);
          },
          error: (error) => {
            console.error('Error al obtener materias:', error);
          }
        });
      }
    }
  }

  toggleExpandir(nombreMateria: string) {
    this.materiaExpandida = this.materiaExpandida === nombreMateria ? null : nombreMateria;
  }

  // Botón 1: Ir a Pasar Asistencia
  irAAsistencia(materiaNombre: string, horarioObj: any) {
    this.router.navigate(['/lista-profesor'], {
      queryParams: {
        grupoId: this.grupoId,
        grupoNombre: this.grupoNombre,
        materiaNombre: materiaNombre,
        horario: horarioObj.texto,
        claseId: horarioObj.id
      }
    });
  }

  // Botón 2: Ir a Capturar Calificaciones
  irACalificaciones(materiaNombre: string, horarioObj: any) {
    this.router.navigate(['/captura-calificaciones'], {
      queryParams: {
        claseId: horarioObj.id, 
        grupoNombre: this.grupoNombre,
        materiaNombre: materiaNombre
      }
    });
  }
}