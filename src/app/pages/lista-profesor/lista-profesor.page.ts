import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  AlertController,
  IonText, IonButtons, IonBackButton, IonIcon 
} from '@ionic/angular/standalone';
import { AlumnosService } from 'src/app/servicios/alumnos.service';
import { AsistenciasProfesorService } from 'src/app/servicios/asistencias-profesor.service';

// --- IMPORTACIÓN OBLIGATORIA DE ÍCONOS ---
import { addIcons } from 'ionicons';
import { checkmarkOutline, closeOutline, alertCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-lista-profesor',
  templateUrl: './lista-profesor.page.html',
  styleUrls: ['./lista-profesor.page.scss'],
  standalone: true,
  imports: [
    IonIcon, IonBackButton, IonButtons, 
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
  ]
})
export class ListaProfesorPage implements OnInit {

  grupoId: number | null = null;
  grupoNombre: string = '';
  materiaId: number | null = null;
  materiaNombre: string = '';
  horario: string = '';

  alumnos: any[] = [];
  dentroHorario: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private alumnosService: AlumnosService,
    private asistenciasProfesorService: AsistenciasProfesorService,
    private alertController: AlertController
  ) {
    // --- REGISTRO DE ÍCONOS PARA EVITAR ERRORES EN CONSOLA ---
    addIcons({ checkmarkOutline, closeOutline, alertCircleOutline });
  }

  ngOnInit() {
    const queryParams = this.route.snapshot.queryParamMap;
    this.grupoId = Number(queryParams.get('grupoId'));
    this.grupoNombre = queryParams.get('grupoNombre') || '';
    this.materiaNombre = queryParams.get('materiaNombre') || '';
    this.materiaId = Number(queryParams.get('materiaId'));
    this.horario = queryParams.get('horario') || '';

    this.verificarHorario();
    this.cargarSolicitudes();
    this.verificarFaltasAutomaticas();
  }

  verificarHorario() {
    const diasSemana: any = {
      'Domingo': 0, 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6
    };

    const partes = this.horario.split(' ');
    const dia = partes[0];
    const horas = partes.slice(1).join(' ').split('-');
    
    if(horas.length < 2) {
        this.dentroHorario = true; 
        return;
    }

    const horaInicio = horas[0].trim();
    const horaFin = horas[1].trim();

    const ahora = new Date();
    const diaActual = ahora.getDay();
    const horaActual = ahora.getHours() + ahora.getMinutes() / 60;

    if (diaActual !== diasSemana[dia]) {
      this.dentroHorario = false;
      console.log(`⚠️ Hoy no es ${dia}`);
      return;
    }

    const [inicioHora, inicioMin] = horaInicio.split(':').map(Number);
    const [finHora, finMin] = horaFin.split(':').map(Number);
    const horaInicioDecimal = inicioHora + inicioMin / 60;
    const horaFinDecimal = finHora + finMin / 60;

    this.dentroHorario = horaActual >= horaInicioDecimal && horaActual <= horaFinDecimal;
  }

  cargarSolicitudes() {
    if (this.grupoId && this.materiaNombre) {
      this.alumnosService.obtenerSolicitudesPorClase(this.grupoId, this.materiaNombre, this.horario)
        .subscribe({
          next: (data) => {
            this.alumnos = data.map(a => ({
              ...a,
              dentroHorario: this.dentroHorario
            }));
          },
          error: (err) => {
            console.error('❌ Error al obtener alumnos:', err);
          }
        });
    }
  }

  verificarFaltasAutomaticas() {
    const profesor = JSON.parse(localStorage.getItem('user') || '{}');
    const profesorId = profesor.id;

    if (this.grupoId && this.materiaId) {
      this.asistenciasProfesorService.verificarFaltas(profesorId, this.grupoId, this.materiaId)
        .subscribe({
          next: (response) => console.log('✅ Faltas verificadas'),
          error: (err) => console.error('❌ Error verificación faltas:', err)
        });
    }
  }

  aceptarSolicitud(solicitudId: number) {
    const profesor = JSON.parse(localStorage.getItem('user') || '{}');
    const profesorId = profesor.id;

    this.alumnosService.responderSolicitud({
      solicitud_id: solicitudId,
      profesor_id: profesorId,
      estado: 'Aceptada'
    }).subscribe({
      next: () => {
        this.presentToast('Solicitud aceptada');
        this.cargarSolicitudes();
      },
      error: () => this.mostrarAlerta('Error', 'No se pudo aceptar.')
    });
  }

  async rechazarSolicitud(solicitudId: number) {
    const alert = await this.alertController.create({
      header: 'Motivo de rechazo',
      inputs: [{ name: 'motivo', type: 'text', placeholder: 'Escribe el motivo...' }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Rechazar',
          handler: data => {
            const profesor = JSON.parse(localStorage.getItem('user') || '{}');
            const profesorId = profesor.id;

            this.alumnosService.responderSolicitud({
              solicitud_id: solicitudId,
              profesor_id: profesorId,
              estado: 'Rechazada',
              observaciones: data.motivo || null
            }).subscribe({
              next: () => {
                this.presentToast('Solicitud rechazada');
                this.cargarSolicitudes();
              },
              error: () => this.mostrarAlerta('Error', 'No se pudo rechazar.')
            });
          }
        }
      ]
    });
    await alert.present();
  }

  async registrarAsistenciaManual(alumno: any) {
    const alert = await this.alertController.create({
      header: 'Asistencia Manual',
      inputs: [{ name: 'motivo', type: 'text', placeholder: 'Motivo (Opcional)' }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Registrar',
          handler: (data) => {
            const profesor = JSON.parse(localStorage.getItem('user') || '{}');
            const profesorId = profesor.id;
            const fecha = new Date().toISOString().slice(0, 10);
            const hora = new Date().toTimeString().slice(0, 8);

            this.alumnosService.registrarAsistenciaManual({
              alumno_id: alumno.alumno_id,
              clase_id: alumno.clase_id,
              profesor_id: profesorId,
              fecha: fecha, hora: hora, motivo: data.motivo
            }).subscribe({
              next: () => {
                this.presentToast('Asistencia registrada');
                this.cargarSolicitudes();
              },
              error: () => this.mostrarAlerta('Error', 'Fallo al registrar.')
            });
          }
        }
      ]
    });
    await alert.present();
  }

  async mostrarAlerta(titulo: string, mensaje: string) {
    const alert = await this.alertController.create({
      header: titulo, message: mensaje, buttons: ['OK']
    });
    await alert.present();
  }

  async presentToast(msg: string) {
    console.log(msg); 
  }
}