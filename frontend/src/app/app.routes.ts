import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { CadastroComponent } from './pages/cadastro/cadastro.component';
import { InicioComponent } from './pages/inicio/inicio.component';
import { PerfilComponent } from './pages/perfil/perfil.component';
import { ReporteComponent } from './pages/reporte/reporte.component';
import { SobreComponent } from './pages/sobre/sobre.component';
import { SenhaEsquecidaComponent } from './pages/senha-esquecida/senha-esquecida.component';
import { InstrucoesEmailComponent } from './pages/instrucoes-email/instrucoes-email.component';
import { RedefinirSenhaComponent } from './pages/redefinir-senha/redefinir-senha.component';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
export const routes: Routes = [
  { path: '', redirectTo: '/sobre', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'cadastro', component: CadastroComponent },
  { path: 'inicio', component: InicioComponent, canActivate: [authGuard] },
  { path: 'perfil', component: PerfilComponent, canActivate: [authGuard] },
  { path: 'reporte', component: ReporteComponent, canActivate: [authGuard] },
  { path: 'sobre', component: SobreComponent },
  { path: 'senha-esquecida', component: SenhaEsquecidaComponent },
  { path: 'instrucoes-email', component: InstrucoesEmailComponent },
  { path: 'redefinirSenha/:token', component: RedefinirSenhaComponent },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule),
    canActivate: [authGuard, adminGuard]
  },
  { path: '**', redirectTo: '/sobre' }
];
