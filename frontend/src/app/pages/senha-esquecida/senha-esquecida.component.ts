import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, ApiResponse } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-senha-esquecida',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './senha-esquecida.component.html',
  styleUrls: ['./senha-esquecida.component.css']
})
export class SenhaEsquecidaComponent {
  email = '';
  isLoading = false;

  constructor(
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router
  ) {}

  enviarEmail(): void {
    if (!this.email) {
      this.toastService.error('Por favor, informe seu email.');
      return;
    }
    
    this.isLoading = true;
    this.authService.esqueciSenha(this.email).subscribe({
      next: (res: ApiResponse) => {
        this.isLoading = false;
        if (res.success) {
          this.toastService.success(res.message || 'Instruções enviadas para seu e-mail.');
          // According to existing JS, it redirects to the URL provided in response or /instrucoes-email
          if (res.redirect) {
            this.router.navigateByUrl(res.redirect);
          } else {
            this.router.navigate(['/instrucoes-email']);
          }
        } else {
          this.toastService.error(res.message || 'Erro ao enviar e-mail.');
        }
      },
      error: () => {
        this.isLoading = false;
        this.toastService.error('Erro de conexão. Tente novamente mais tarde.');
      }
    });
  }
}
