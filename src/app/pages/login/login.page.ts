import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, 
  IonButton, 
  IonIcon,
  IonSpinner
} from '@ionic/angular/standalone';
import { AuthService } from '../../servicios/auth.service';
import { addIcons } from 'ionicons';
import { atOutline, lockClosedOutline, arrowForwardOutline } from 'ionicons/icons';

// Registrar iconos
addIcons({ atOutline, lockClosedOutline, arrowForwardOutline });

@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  styleUrls: ['login.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonButton,
    IonIcon,
    IonSpinner,
    CommonModule,
    FormsModule,
  ]
})
export class LoginPage {
  correo: string = '';
  contrasena: string = '';
  loading: boolean = false; // Para mostrar spinner en el botón

  constructor(private authService: AuthService, private router: Router) {}

  onLogin() {
    if (!this.correo || !this.contrasena) {
      alert('Por favor ingresa correo y contraseña');
      return;
    }

    this.loading = true;
    (document.activeElement as HTMLElement)?.blur(); // Ocultar teclado

    this.authService.login(this.correo, this.contrasena).subscribe({
      next: (response) => {
        this.loading = false;
        console.log('Login exitoso', response);
        localStorage.setItem('user', JSON.stringify(response));

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
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error en login:', error);
        
        let mensaje = 'Error desconocido';
        if (error.status === 0) mensaje = 'Error de conexión con el servidor.';
        else if (error.status === 401) mensaje = 'Credenciales incorrectas.';
        else if (error.error?.error) mensaje = error.error.error;

        alert(mensaje);
      }
    });
  }
}