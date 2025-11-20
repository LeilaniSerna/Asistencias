import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonNote,
  IonCardSubtitle,
  IonIcon
} from '@ionic/angular/standalone';
import { Geolocation } from '@capacitor/geolocation';
import { addIcons } from 'ionicons';
import { star, warning } from 'ionicons/icons';

// Registrar iconos
addIcons({ star, warning });

interface MateriaAlumno {
  clase_id: number;
  nombre_materia: string;
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
  estado_solicitud: string;
  observaciones?: string;
  puede_solicitar: boolean;
}

interface AsistenciaResumen {
  materia: string;
  asistencias: number;
  faltas_justificadas: number;
  faltas_injustificadas: number;
}

interface CalificacionMateria {
  nombre: string;
  calificacion: number;
}

@Component({
  selector: 'app-inicio-alumno',
  templateUrl: './inicio-alumno.page.html',
  styleUrls: ['./inicio-alumno.page.scss'],
  standalone: true,
  imports: [
    IonCardSubtitle,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    HttpClientModule,
    IonGrid,
    IonRow,
    IonCol,
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonNote,
    IonIcon,
    DecimalPipe
  ]
})
export class InicioAlumnoPage implements OnInit {
  alumnoId: number = 0;
  nombreCompleto: string = '';
  grupoNombre: string = '';
  materias: MateriaAlumno[] = [];
  asistenciasResumen: AsistenciaResumen[] = [];

  // Variables para el Resumen Académico
  promedioGeneral: number | null = null;
  materiaSobresaliente: CalificacionMateria | null = null;
  materiaMejorar: CalificacionMateria | null = null;

  // URL de la API (Tu URL de Railway)
  private apiUrl = 'https://asistencias-production-7dba.up.railway.app';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const usuarioId = user.id;

    if (usuarioId) {
      this.obtenerAlumnoIdPorUsuario(usuarioId);
    }
  }

  obtenerAlumnoIdPorUsuario(usuarioId: number) {
    this.http.get<{ alumno_id: number }>(`${this.apiUrl}/usuario/${usuarioId}/alumno-id`)
      .subscribe({
        next: (res) => {
          this.alumnoId = res.alumno_id;
          // Cargar toda la información una vez que tenemos el ID
          this.obtenerDatosAlumno(this.alumnoId);
          this.obtenerMaterias(this.alumnoId);
          this.obtenerResumenAsistencias(this.alumnoId);
          this.obtenerCalificaciones(this.alumnoId); // <--- ¡Llamada agregada!
        },
        error: (err) => {
          console.error('Error al obtener alumnoId:', err);
        }
      });
  }

  obtenerDatosAlumno(alumnoId: number) {
    this.http.get<any>(`${this.apiUrl}/alumno/${alumnoId}/info`).subscribe(response => {
      this.nombreCompleto = `${response.nombre} ${response.apellido}`;
      this.grupoNombre = response.grupo;
    });
  }

  obtenerMaterias(alumnoId: number) {
    this.http.get<MateriaAlumno[]>(`${this.apiUrl}/alumno/${alumnoId}/materias`).subscribe(response => {
      const ahora = new Date();
      const diaActual = this.obtenerDiaSemana(ahora.getDay());
      const horaActual = ahora.toTimeString().slice(0, 5);

      this.materias = response.map(m => {
        const dentroHorario =
          m.dia_semana === diaActual &&
          horaActual >= m.hora_inicio &&
          horaActual <= m.hora_fin;

        return {
          ...m,
          puede_solicitar: dentroHorario
        };
      });
    });
  }

  obtenerResumenAsistencias(alumnoId: number) {
    this.http.get<AsistenciaResumen[]>(`${this.apiUrl}/alumno/${alumnoId}/asistencias-resumen`).subscribe({
      next: (res) => {
        this.asistenciasResumen = res;
      },
      error: (err) => {
        console.error('Error al obtener resumen de asistencias:', err);
      }
    });
  }

  // --- FUNCIÓN NUEVA PARA CALIFICACIONES ---
  obtenerCalificaciones(alumnoId: number) {
    this.http.get<any>(`${this.apiUrl}/alumno/${alumnoId}/calificaciones-resumen`).subscribe({
      next: (res) => {
        this.promedioGeneral = res.promedio;
        this.materiaSobresaliente = res.mejorMateria;
        this.materiaMejorar = res.peorMateria;
      },
      error: (err) => {
        console.error('Error al obtener calificaciones:', err);
      }
    });
  }

  obtenerDiaSemana(dia: number): string {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return dias[dia];
  }

  async enviarSolicitud(clase_id: number) {
    try {
      const hoy = new Date();
      const fechaLocal = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
      const horaLocal = hoy.toTimeString().slice(0, 8);

      const coordinates = await Geolocation.getCurrentPosition();

      const payload = {
        alumno_id: this.alumnoId,
        clase_id: clase_id,
        fecha: fechaLocal,
        hora: horaLocal,
        latitud_usuario: coordinates.coords.latitude,
        longitud_usuario: coordinates.coords.longitude
      };

      this.http.post(`${this.apiUrl}/alumno/enviar-solicitud`, payload).subscribe(
        res => {
          alert('Solicitud enviada correctamente');
          this.obtenerMaterias(this.alumnoId);
        },
        err => {
          const errorMsg = err.error?.error || 'Error desconocido al enviar solicitud';
          alert('No se pudo enviar la solicitud: ' + errorMsg);

          if (errorMsg.toLowerCase().includes('pendiente')) {
            this.obtenerMaterias(this.alumnoId);
          }
        }
      );
    } catch (error) {
      console.error('Error al obtener ubicación:', error);
      alert('No se pudo obtener la ubicación. Activa el GPS e inténtalo de nuevo.');
    }
  }
}