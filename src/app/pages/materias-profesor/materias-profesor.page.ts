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
  IonLabel
} from '@ionic/angular/standalone';
import { MateriasProfesorService } from 'src/app/servicios/materias-profesor.service';

@Component({
  selector: 'app-materias-profesor',
  templateUrl: './materias-profesor.page.html',
  styleUrls: ['./materias-profesor.page.scss'],
  standalone: true,
  imports: [
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
    CommonModule,
    FormsModule
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
              agrupadas[item.nombre].horarios.push(item.horario);
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

  irALista(materiaNombre: string, horario: string) {
    this.router.navigate(['/lista-profesor'], {
      queryParams: {
        grupoId: this.grupoId,
        grupoNombre: this.grupoNombre,
        materiaNombre,
        horario
      }
    });
  }
}
