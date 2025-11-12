import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Capacitor } from '@capacitor/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // Usamos la URL de Railway
  // Eva a funcionar web y para el celular
  private API_URL = 'https://asistencias-production-7dba.up.railway.app';

  constructor(private http: HttpClient, private router: Router) {
    // Ya no es necesario el bloque if/else de Capacitor
    // porque la URL de la nube es accesible desde cualquier plataforma.
  }

  login(correo: string, contrasena: string): Observable<any> {
    const body = { correo, contrasena };
    console.log('Enviando solicitud de login a:', `${this.API_URL}/login`);
    console.log('Datos enviados:', body);
    return this.http.post(`${this.API_URL}/login`, body).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('--- Error en la solicitud de login ---');
        console.error('Status:', error.status);
        console.error('Mensaje de error:', error.message);
        if (error.error) {
          console.error('Respuesta del servidor:', error.error);
        }
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    localStorage.clear(); // o localStorage.removeItem('user');
    this.router.navigateByUrl('/login');
  }

}