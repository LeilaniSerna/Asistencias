import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonGrid, IonRow, IonCol,
  IonButton, IonCard, IonCardContent, IonIcon, IonSpinner, IonSegment, IonSegmentButton, IonLabel
} from '@ionic/angular/standalone';
import { Geolocation } from '@capacitor/geolocation';
import { addIcons } from 'ionicons';
import { checkmarkCircle, closeCircle, time, warning, alertCircle, calendar } from 'ionicons/icons';

addIcons({ checkmarkCircle, closeCircle, time, warning, alertCircle, calendar });

interface MateriaAlumno {
  clase_id: number;
  nombre_materia: string;
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
  estado_solicitud: string | null;
  observaciones?: string;
  puede_solicitar: boolean;
}

interface AsistenciaResumen {
  materia: string;
  asistencias: number;
  faltas_justificadas: number;
  faltas_injustificadas: number;
  total_faltas: number;
}

interface RecomendacionIA {
  nombre: string;
  motivo: string;
  probabilidad: number;
}

interface HistorialItem {
  materia: string;
  periodo: string;
  calificacion: number;
  riesgo: number;
}

@Component({
  selector: 'app-inicio-alumno',
  templateUrl: './inicio-alumno.page.html',
  styleUrls: ['./inicio-alumno.page.scss'],
  standalone: true,
  imports: [
    IonContent, CommonModule, FormsModule, HttpClientModule,
    IonIcon, IonSpinner,
    IonSegment, IonSegmentButton, IonLabel, DecimalPipe
  ]
})
export class InicioAlumnoPage implements OnInit {
  alumnoId: number = 0;
  nombreCompleto: string = 'Cargando...';
  grupoNombre: string = '';
  
  materias: MateriaAlumno[] = [];
  asistenciasResumen: AsistenciaResumen[] = [];
  
  // Dashboard y Calificaciones
  promedioGeneral: number = 0;
  atencionPrioritaria: RecomendacionIA | null = null;
  
  // Historial Completo y Filtrado
  historialCompleto: HistorialItem[] = [];
  calificacionesFiltradas: HistorialItem[] = [];
  
  // Gestión de Periodos
  periodosDisponibles: string[] = [];
  periodoSeleccionado: string = '';
  
  loading: boolean = true;

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
          this.cargarDatosDashboard();
        },
        error: (err) => {
          console.error('Error al obtener alumnoId:', err);
          this.loading = false;
        }
      });
  }

  cargarDatosDashboard() {
    this.loading = true;
    Promise.all([
      this.obtenerDatosPersonales(),
      this.obtenerMaterias(),
      this.obtenerResumenAsistencias(),
      this.obtenerCalificaciones()
    ]).finally(() => {
      this.loading = false;
    });
  }

  obtenerDatosPersonales() {
    return new Promise<void>(resolve => {
      this.http.get<any>(`${this.apiUrl}/alumno/${this.alumnoId}/info`).subscribe({
        next: (res) => {
          this.nombreCompleto = `${res.nombre} ${res.apellido}`;
          this.grupoNombre = res.grupo;
          resolve();
        },
        error: () => resolve()
      });
    });
  }

  obtenerMaterias() {
    return new Promise<void>(resolve => {
      this.http.get<MateriaAlumno[]>(`${this.apiUrl}/alumno/${this.alumnoId}/materias`).subscribe({
        next: (response) => {
          const ahora = new Date();
          const diaActual = this.obtenerDiaSemana(ahora.getDay());
          const horaActual = ahora.toTimeString().slice(0, 5); 

          this.materias = response.map(m => {
            const esHoy = m.dia_semana === diaActual;
            const enHorario = horaActual >= m.hora_inicio && horaActual <= m.hora_fin;
            
            return {
              ...m,
              puede_solicitar: esHoy && enHorario
            };
          });
          resolve();
        },
        error: () => resolve()
      });
    });
  }

  obtenerResumenAsistencias() {
    return new Promise<void>(resolve => {
      this.http.get<any[]>(`${this.apiUrl}/alumno/${this.alumnoId}/asistencias-resumen`).subscribe({
        next: (res) => {
          this.asistenciasResumen = res.map(item => ({
            ...item,
            total_faltas: item.faltas_injustificadas + item.faltas_justificadas
          }));
          resolve();
        },
        error: () => resolve()
      });
    });
  }

  obtenerCalificaciones() {
    return new Promise<void>(resolve => {
      this.http.get<any>(`${this.apiUrl}/alumno/${this.alumnoId}/calificaciones-resumen`).subscribe({
        next: (res) => {
          this.promedioGeneral = res.promedio || 0;
          this.atencionPrioritaria = res.atencion_prioritaria || null; 
          this.historialCompleto = res.historial_completo || [];
          
          // Extraer periodos únicos y ordenar
          const periodosSet = new Set(this.historialCompleto.map(h => h.periodo));
          this.periodosDisponibles = Array.from(periodosSet).sort();

          // Seleccionar por defecto el último periodo (el más reciente o mayor)
          if (this.periodosDisponibles.length > 0) {
            this.periodoSeleccionado = this.periodosDisponibles[this.periodosDisponibles.length - 1]; // Último
            this.filtrarCalificaciones();
          }
          
          resolve();
        },
        error: (err) => {
          console.error('Error al obtener calificaciones:', err);
          resolve();
        }
      });
    });
  }

  // Función llamada cuando cambia el Segment
  filtrarCalificaciones() {
    if (this.periodoSeleccionado) {
      this.calificacionesFiltradas = this.historialCompleto.filter(
        h => h.periodo === this.periodoSeleccionado
      );
    } else {
      this.calificacionesFiltradas = [];
    }
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

      this.http.post(`${this.apiUrl}/alumno/enviar-solicitud`, payload).subscribe({
        next: () => {
          alert('Solicitud enviada correctamente');
          this.obtenerMaterias();
        },
        error: (err) => {
          const errorMsg = err.error?.error || 'Error desconocido';
          alert('No se pudo enviar: ' + errorMsg);
        }
      });
    } catch (error) {
      alert('Error de GPS. Activa tu ubicación.');
    }
  }
}