import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MateriasProfesorService {

  private baseUrl = 'http://192.168.0.105:5000';

  constructor(private http: HttpClient) {}

  obtenerMaterias(profesorId: number, grupoId: number): Observable<any[]> {
    const url = `${this.baseUrl}/profesor/${profesorId}/grupos/${grupoId}/materias`;
    return this.http.get<any[]>(url).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('Error en MateriasProfesorService:', error);
    return throwError(() => error);
  }
}
