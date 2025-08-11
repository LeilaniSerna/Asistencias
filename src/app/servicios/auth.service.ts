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

  private API_URL = '';

  constructor(private http: HttpClient, private router: Router) {
    if (Capacitor.isNativePlatform()) {
      this.API_URL = 'http://192.168.0.106:5000';
    } else {
      this.API_URL = 'http://192.168.0.106:5000';
    }
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
