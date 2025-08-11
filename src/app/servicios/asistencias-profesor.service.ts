import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AsistenciasProfesorService {

  private apiUrl = 'http://localhost:5000';  // Ajusta si tu API cambia de puerto o dominio

  constructor(private http: HttpClient) { }

  verificarFaltas(profesorId: number, grupoId: number, materiaId: number): Observable<any> {
    const body = {
      profesor_id: profesorId,
      grupo_id: grupoId,
      materia_id: materiaId
    };

    return this.http.post(`${this.apiUrl}/profesor/verificar-faltas`, body);
  }
}
