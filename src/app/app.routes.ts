import { Routes } from '@angular/router';
import { adminGuard } from './servicios/admin.guard';
import { profGuard } from './servicios/prof.guard';
import { alumGuard } from './servicios/alum.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'inicioad', // Administrador (PTC)
    loadComponent: () => import('./inicioad/inicioad.component').then(m => m.InicioadComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'iniciopr', // Profesor
    loadComponent: () => import('./inicioprof/inicioprof.component').then(m => m.InicioprofComponent),
    canActivate: [profGuard]
  },
  {
    path: 'inicioalum', // Alumno
    loadComponent: () => import('./inicioalum/inicioalum.component').then(m => m.InicioalumComponent),
    canActivate: [alumGuard]
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'gestionar-grupos',
    loadComponent: () => import('./pages/gestionar-grupos/gestionar-grupos.page').then( m => m.GestionarGruposPage)
  },
  {
    path: 'gestionar-materias',
    loadComponent: () => import('./pages/gestionar-materias/gestionar-materias.page').then( m => m.GestionarMateriasPage)
  },
  {
    path: 'gestionar-profesores',
    loadComponent: () => import('./pages/gestionar-profesores/gestionar-profesores.page').then( m => m.GestionarProfesoresPage)
  },
  {
    path: 'gestionar-alumnos',
    loadComponent: () => import('./pages/gestionar-alumnos/gestionar-alumnos.page').then( m => m.GestionarAlumnosPage)
  },
  {
    path: 'historial-asistencias',
    loadComponent: () => import('./pages/historial-asistencias/historial-asistencias.page').then( m => m.HistorialAsistenciasPage)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'inicio-profesor',
    loadComponent: () => import('./pages/inicio-profesor/inicio-profesor.page').then( m => m.InicioProfesorPage)
  },
  {
    path: 'materias-profesor',
    loadComponent: () => import('./pages/materias-profesor/materias-profesor.page').then( m => m.MateriasProfesorPage)
  },
  {
    path: 'materias/:grupoId', 
    loadComponent: () => import('./pages/materias-profesor/materias-profesor.page').then( m => m.MateriasProfesorPage),
    canActivate: [profGuard]
  },
  {
    path: 'lista-profesor',
    loadComponent: () => import('./pages/lista-profesor/lista-profesor.page').then( m => m.ListaProfesorPage)
  },
  {
    path: 'inicio-alumno',
    loadComponent: () => import('./pages/inicio-alumno/inicio-alumno.page').then( m => m.InicioAlumnoPage)
  }
];
