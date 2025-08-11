import { Component } from '@angular/core';
import { IonContent, IonInput, IonButton } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../servicios/auth.service';
import { InicioProfesorPage } from "../inicio-profesor/inicio-profesor.page";
import { InicioAlumnoPage } from '../inicio-alumno/inicio-alumno.page';

@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  styleUrls: ['login.page.scss'],
  standalone: true,
  imports: [
    IonButton,
    IonInput,
    IonContent,
    FormsModule,
  ]
})
export class LoginPage {
  correo: string = '';
  contrasena: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  onLogin() {
    console.log('Botón presionado');
    console.log('Datos enviados:', { correo: this.correo, contrasena: this.contrasena });

    (document.activeElement as HTMLElement)?.blur(); // Quitar foco del input

    this.authService.login(this.correo, this.contrasena).subscribe({
      next: (response) => {
        console.log('Login exitoso', response);

        // Guardar usuario en localStorage
        localStorage.setItem('user', JSON.stringify(response));

        // Redirigir según rol
        switch (response.rol_id) {
          case 1:
            this.router.navigate(['/inicioad']);
            break;
          case 2:
            this.router.navigate(['/inicio-profesor']);
            break;
          case 3:
            this.router.navigate(['/inicio-alumno']);
            break;
          default:
            alert('Rol no válido');
            this.router.navigate(['/login']);
        }
      },
      error: (error) => {
        console.error('Error en login:', error);

        // Detectar si es error de red (el servidor no responde)
        if (error.status === 0) {
          alert('❌ Error de conexión con el servidor\n\nVerifica si la IP es correcta y si tu servidor Flask está encendido.');
          return;
        }

        // Si el backend respondió con mensaje de error
        const mensajeBackend = error?.error?.error || error?.message || 'Error desconocido';

        switch (error.status) {
          case 400:
            alert(`⚠️ Solicitud inválida: ${mensajeBackend}`);
            break;
          case 401:
            alert(`🔒 Acceso denegado: ${mensajeBackend}`);
            break;
          case 404:
            alert(`❌ No encontrado: ${mensajeBackend}`);
            break;
          case 500:
            alert(`💥 Error interno en el servidor: ${mensajeBackend}`);
            break;
          default:
            alert(`❗ Error inesperado (status ${error.status}): ${mensajeBackend}`);
        }
      }
    });
  }
}
