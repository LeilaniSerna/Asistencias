import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment'; // Importamos el environment

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // Leemos la URL desde el archivo de configuración (environment.ts)
  private API_URL = environment.apiUrl;

  constructor(private http: HttpClient, private router: Router) {
    console.log('AuthService inicializado con API:', this.API_URL);
  }

  login(correo: string, contrasena: string): Observable<any> {
    const body = { correo, contrasena };
    return this.http.post(`${this.API_URL}/login`, body).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('--- Error en la solicitud de login ---');
        console.error('Status:', error.status);
        console.error('Mensaje:', error.message);
        if (error.error) {
          console.error('Respuesta servidor:', error.error);
        }
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    localStorage.clear();
    this.router.navigateByUrl('/login');
  }
}