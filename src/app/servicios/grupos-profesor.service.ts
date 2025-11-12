import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class GruposProfesorService {
  private baseUrl = 'http://192.168.0.105:5000';

  constructor(private http: HttpClient) {}

  obtenerGruposPorProfesor(profesorId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/profesor/${profesorId}/grupos`).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('Error en GruposProfesorService:', error);
    return throwError(() => error);
  }
}
