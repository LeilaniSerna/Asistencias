import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonIcon,
  IonButton,
  AlertController,
  IonBadge,
  IonToast
} from '@ionic/angular/standalone';
import { AlumnosService } from 'src/app/servicios/alumnos.service';
import { AsistenciasProfesorService } from 'src/app/servicios/asistencias-profesor.service';

// Iconos necesarios
import { addIcons } from 'ionicons';
import { 
  checkmarkOutline, 
  closeOutline, 
  alertCircle, 
  timeOutline, 
  createOutline, 
  lockClosed 
} from 'ionicons/icons';

addIcons({ checkmarkOutline, closeOutline, alertCircle, timeOutline, createOutline, lockClosed });

@Component({
  selector: 'app-lista-profesor',
  templateUrl: './lista-profesor.page.html',
  styleUrls: ['./lista-profesor.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, 
    IonIcon, CommonModule, FormsModule
  ]
})
export class ListaProfesorPage implements OnInit, OnDestroy {

  grupoId: number | null = null;
  grupoNombre: string = '';
  materiaId: number | null = null;
  materiaNombre: string = '';
  horario: string = '';

  alumnos: any[] = [];
  dentroHorario: boolean = false; // Candado de seguridad
  intervalId: any;

  constructor(
    private route: ActivatedRoute,
    private alumnosService: AlumnosService,
    private asistenciasProfesorService: AsistenciasProfesorService,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    const queryParams = this.route.snapshot.queryParamMap;
    this.grupoId = Number(queryParams.get('grupoId'));
    this.grupoNombre = queryParams.get('grupoNombre') || '';
    this.materiaNombre = queryParams.get('materiaNombre') || '';
    this.materiaId = Number(queryParams.get('materiaId'));
    this.horario = queryParams.get('horario') || '';

    this.verificarHorario();
    this.cargarSolicitudes();
    
    // Verificamos cada 30 segundos si sigue dentro del horario para bloquear/desbloquear en tiempo real
    this.intervalId = setInterval(() => this.verificarHorario(), 30000);
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  verificarHorario() {
    const diasSemana: any = {
      'Domingo': 0, 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6
    };

    if (!this.horario) return;

    // Se asume formato: "Viernes 11:00 - 12:00"
    // Dividimos por espacios
    const partes = this.horario.split(' ');
    const diaTexto = partes[0]; 
    
    // Buscamos las horas en el resto del string
    const resto = partes.slice(1).join(''); // "11:00-12:00"
    const [horaInicioStr, horaFinStr] = resto.split('-');

    if (!horaInicioStr || !horaFinStr) {
       // Si el formato es raro, por seguridad cerramos o dejamos abierto según prefieras.
       // Aquí asumimos abierto para no bloquear si hay error de formato, pero idealmente se valida.
       this.dentroHorario = true; 
       return;
    }

    const ahora = new Date();
    const diaActual = ahora.getDay();
    
    // Convertir horas a decimales para comparar (ej: 11:30 -> 11.5)
    const [hIni, mIni] = horaInicioStr.split(':').map(Number);
    const [hFin, mFin] = horaFinStr.split(':').map(Number);
    
    const tiempoInicio = hIni + (mIni || 0) / 60;
    const tiempoFin = hFin + (mFin || 0) / 60;
    const tiempoActual = ahora.getHours() + ahora.getMinutes() / 60;

    // Validación estricta: Día correcto Y Hora correcta
    // Permitimos un margen de 10 min antes y después por flexibilidad operativa si lo deseas
    if (diaActual === diasSemana[diaTexto] && tiempoActual >= tiempoInicio && tiempoActual <= tiempoFin) {
      this.dentroHorario = true;
    } else {
      this.dentroHorario = false;
    }
    
    console.log(`🔒 Candado Asistencia: ${this.dentroHorario ? 'ABIERTO' : 'CERRADO'} (Hora: ${tiempoActual.toFixed(2)})`);
  }

  cargarSolicitudes() {
    if (this.grupoId && this.materiaNombre) {
      this.alumnosService.obtenerSolicitudesPorClase(this.grupoId, this.materiaNombre, this.horario)
        .subscribe({
          next: (data) => {
            this.alumnos = data.map(a => ({
              ...a,
              // Mapeo seguro de riesgos
              ia_risk: a.ia_risk || 0 
            }));
          },
          error: (err) => console.error('Error cargando alumnos:', err)
        });
    }
  }

  aceptarSolicitud(solicitudId: number) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.alumnosService.responderSolicitud({
      solicitud_id: solicitudId,
      profesor_id: user.id,
      estado: 'Aceptada'
    }).subscribe({
      next: () => this.cargarSolicitudes(),
      error: () => this.mostrarAlerta('Error', 'No se pudo aceptar.')
    });
  }

  async rechazarSolicitud(solicitudId: number) {
    const alert = await this.alertController.create({
      header: 'Rechazar Solicitud',
      inputs: [{ name: 'motivo', placeholder: 'Motivo del rechazo' }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Rechazar',
          handler: (data) => {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            this.alumnosService.responderSolicitud({
              solicitud_id: solicitudId,
              profesor_id: user.id,
              estado: 'Rechazada',
              observaciones: data.motivo
            }).subscribe({
              next: () => this.cargarSolicitudes(),
              error: () => this.mostrarAlerta('Error', 'No se pudo rechazar.')
            });
          }
        }
      ]
    });
    await alert.present();
  }

  async registrarAsistenciaManual(alumno: any) {
    // --- SEGURIDAD ANTI-TRAMPA ---
    // Recalcular al momento del click para evitar que dejen la página abierta
    this.verificarHorario(); 
    
    if (!this.dentroHorario) {
      this.mostrarAlerta('🔒 Acción Bloqueada', 'Solo puedes registrar asistencia manual durante el horario de la clase.');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Registro Manual',
      message: `Asistencia para ${alumno.nombre}`,
      inputs: [{ name: 'motivo', placeholder: 'Motivo (opcional)' }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Registrar',
          handler: (data) => {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const now = new Date();
            
            this.alumnosService.registrarAsistenciaManual({
              alumno_id: alumno.alumno_id,
              clase_id: alumno.clase_id,
              profesor_id: user.id,
              fecha: now.toISOString().slice(0, 10),
              hora: now.toTimeString().slice(0, 8),
              motivo: data.motivo || 'Manual por Profesor'
            }).subscribe({
              next: () => this.cargarSolicitudes(),
              error: () => this.mostrarAlerta('Error', 'Fallo al registrar.')
            });
          }
        }
      ]
    });
    await alert.present();
  }

  async mostrarAlerta(header: string, message: string) {
    const alert = await this.alertController.create({ header, message, buttons: ['OK'] });
    await alert.present();
  }
}