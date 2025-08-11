import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonGrid,
  IonRow,
  IonCol,
  IonHeader,
  IonToolbar,
  IonTitle
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { GruposProfesorService } from 'src/app/servicios/grupos-profesor.service';
import { logOutOutline } from 'ionicons/icons';

// ✅ Importación del componente de encabezado personalizado
import { HeaderComponent } from 'src/app/componentes/header/header.component';

@Component({
  selector: 'app-inicio-profesor',
  templateUrl: './inicio-profesor.page.html',
  styleUrls: ['./inicio-profesor.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonTitle,
    IonToolbar,
    IonHeader,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonGrid,
    IonRow,
    IonCol,
    HeaderComponent 
  ]
})
export class InicioProfesorPage implements OnInit {
  nombreProfesor: string = 'Profesor';
  grupos: any[] = [];
  profesorId: number | null = null;
  logOutIcon = logOutOutline;

  constructor(
    private router: Router,
    private gruposProfesorService: GruposProfesorService
  ) {}

  ngOnInit() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.profesorId = user?.id ?? null;

    if (this.profesorId !== null) {
      this.cargarDatosProfesor(this.profesorId);
    } else {
      console.warn('profesorId es null, no se cargarán grupos');
    }
  }

  cargarDatosProfesor(id: number) {
    this.gruposProfesorService.obtenerGruposPorProfesor(id).subscribe({
      next: (response) => {
        this.nombreProfesor = response.profesor || 'Profesor';
        this.grupos = response.grupos || [];
      },
      error: (error) => {
        console.error('Error al obtener grupos del profesor:', error);
      }
    });
  }

  irAMaterias(grupoId: number, grupoNombre: string) {
    this.router.navigate(['/materias', grupoId], {
      queryParams: {
        grupoNombre: grupoNombre
      }
    });
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
