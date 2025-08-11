import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonButtons,
  IonButton,
  IonIcon
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { logOutOutline } from 'ionicons/icons';
import { AuthService } from 'src/app/servicios/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    IonButtons,
    IonButton,
    IonIcon
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  @Input() titulo: string = 'Inicio';
  logoutIcon = logOutOutline; 

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
