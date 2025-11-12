import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MateriaAlumno {
  clase_id: number;
  nombre_materia: string;
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
  estado_solicitud: string;
  observaciones?: string;
  puede_solicitar: boolean;
}

export interface AlumnoInfo {
  nombre: string;
  apellido: string;
  grupo: string;
}

@Injectable({
  providedIn: 'root'
})
export class InicioAlumnoService {

  private apiUrl = 'http://192.168.0.105:5000';

  constructor(private http: HttpClient) {}

  obtenerInfoAlumno(alumnoId: number): Observable<AlumnoInfo> {
    return this.http.get<AlumnoInfo>(`${this.apiUrl}/alumno/${alumnoId}/info`);
  }

  obtenerMateriasAlumno(alumnoId: number): Observable<MateriaAlumno[]> {
    return this.http.get<MateriaAlumno[]>(`${this.apiUrl}/alumno/${alumnoId}/materias`);
  }

  enviarSolicitudAsistencia(alumnoId: number, claseId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/alumno/${alumnoId}/solicitud`, {
      clase_id: claseId
    });
  }
}
