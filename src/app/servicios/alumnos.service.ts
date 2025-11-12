import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AlumnoDetalle {
  id: number;
  nombre: string;
  apellido: string;
  grupo: string;
  materia: string;
  faltas: number;
}

@Injectable({
  providedIn: 'root'
})
export class AlumnosService {
  private apiUrl = 'https://asistencias-production-7dba.up.railway.app';

  constructor(private http: HttpClient) {}

  // alumnos y faltas por materia
  obtenerAlumnosDetalle(): Observable<AlumnoDetalle[]> {
    return this.http.get<AlumnoDetalle[]>(`${this.apiUrl}/alumnos-detalle`);
  }

  // Obtener lista de alumnos con estado de solicitud por grupo y materia
  obtenerSolicitudesPorClase(
    grupoId: number,
    materiaNombre: string,
    horario: string
  ): Observable<any[]> {
    const params = new HttpParams()
      .set('grupoId', grupoId.toString())
      .set('materiaNombre', materiaNombre)
      .set('horario', horario); 

    return this.http.get<any[]>(`${this.apiUrl}/profesor/alumnos-solicitudes`, { params });
  }

  // Enviar respuesta a una solicitud (aceptar o rechazar)
  responderSolicitud(data: {
    solicitud_id: number;
    profesor_id: number;
    estado: string;
    observaciones?: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/solicitud-asistencia/responder`, data);
  }

  // Registrar asistencia manual (profesor)
  registrarAsistenciaManual(data: {
    alumno_id: number;
    clase_id: number;
    profesor_id: number;
    fecha: string;   // Formato YYYY-MM-DD
    hora: string;    // Formato HH:MM:SS
    motivo: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/asistencia/manual`, data);
  }
}
