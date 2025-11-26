import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonIcon,
  IonToast, IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { saveOutline, checkmarkCircle, alertCircle } from 'ionicons/icons';

addIcons({ saveOutline, checkmarkCircle, alertCircle });

interface AlumnoCalificacion {
  alumno_id: number;
  matricula: string;
  nombre: string;
  apellido: string;
  calificacion: number | null;
  observaciones: string;
  guardado: boolean;
  modificado?: boolean;
  // --- INTEGRACIÓN IA: Campos nuevos ---
  ia_risk?: number; // 0 = Bajo, 1 = Moderado, 2 = Alto
  ia_msg?: string;
  ia_prob?: number; // Porcentaje de probabilidad
}

@Component({
  selector: 'app-captura-calificaciones',
  templateUrl: './captura-calificaciones.page.html',
  styleUrls: ['./captura-calificaciones.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonIcon, 
    IonToast, IonSpinner,
    CommonModule, FormsModule, HttpClientModule
  ]
})
export class CapturaCalificacionesPage implements OnInit {
  
  claseId: number = 0;
  materiaNombre: string = 'Cargando...';
  grupoNombre: string = '';
  
  periodoSeleccionado: string = 'Parcial 1';
  alumnos: AlumnoCalificacion[] = [];
  loading: boolean = false;

  private apiUrl = 'https://asistencias-production-7dba.up.railway.app';
  toastMessage: string = '';
  isToastOpen: boolean = false;

  constructor(private http: HttpClient, private route: ActivatedRoute) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params && params['claseId']) {
        this.claseId = params['claseId'];
        this.materiaNombre = params['materiaNombre'];
        this.grupoNombre = params['grupoNombre'];
        this.cargarAlumnos();
      }
    });
  }

  cargarAlumnos() {
    if (!this.claseId) return;
    this.loading = true;
    this.http.get<AlumnoCalificacion[]>(
      `${this.apiUrl}/profesor/clase/${this.claseId}/alumnos-calificaciones?periodo=${this.periodoSeleccionado}`
    ).subscribe({
      next: (res) => {
        // Mapeamos la respuesta asegurando que modificado inicie en false
        this.alumnos = res.map(a => ({...a, modificado: false}));
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  onCambioInput(alumno: AlumnoCalificacion) {
    alumno.modificado = true;
  }

  guardarCalificacion(alumno: AlumnoCalificacion) {
    if (alumno.calificacion === null || alumno.calificacion < 0 || alumno.calificacion > 10) {
      this.presentToast('Calificación inválida (0-10)');
      return;
    }

    const payload = {
      alumno_id: alumno.alumno_id,
      clase_id: this.claseId,
      periodo: this.periodoSeleccionado,
      calificacion: alumno.calificacion,
      observaciones: alumno.observaciones
    };

    this.http.post(`${this.apiUrl}/profesor/guardar-calificacion`, payload).subscribe({
      next: () => {
        alumno.modificado = false;
        alumno.guardado = true;
        this.presentToast(`Guardado: ${alumno.nombre}`);
      },
      error: () => this.presentToast('Error al guardar')
    });
  }

  guardarTodo() {
    const pendientes = this.alumnos.filter(a => a.modificado);
    if (pendientes.length === 0) {
      this.presentToast('No hay cambios pendientes');
      return;
    }
    pendientes.forEach(alumno => this.guardarCalificacion(alumno));
  }

  presentToast(msg: string) {
    this.toastMessage = msg;
    this.isToastOpen = true;
  }
}