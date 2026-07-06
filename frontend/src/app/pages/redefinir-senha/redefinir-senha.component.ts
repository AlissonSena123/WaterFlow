import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, ApiResponse } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-redefinir-senha',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './redefinir-senha.component.html',
  styleUrls: ['./redefinir-senha.component.css']
})
export class RedefinirSenhaComponent implements OnInit {
  token = '';
  novaSenha = '';
  confirmarSenha = '';
  isLoading = false;
  isValidating = true;
  tokenValido = false;
  tokenErro = '';

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.token = params.get('token') || '';
      if (this.token) {
        this.validarToken();
      } else {
        this.isValidating = false;
        this.tokenValido = false;
        this.tokenErro = 'Token não encontrado. Solicite um novo link.';
      }
    });
  }

  private validarToken(): void {
    this.isValidating = true;
    this.authService.validarTokenSenha(this.token).subscribe({
      next: (res: { success: boolean; email?: string; message?: string }) => {
        this.isValidating = false;
        if (res.success) {
          this.tokenValido = true;
        } else {
          this.tokenValido = false;
          this.tokenErro = res.message || 'Link inválido ou expirado.';
        }
      },
      error: () => {
        this.isValidating = false;
        this.tokenValido = false;
        this.tokenErro = 'Link inválido ou expirado.';
      }
    });
  }

  atualizarSenha(): void {
    if (this.novaSenha !== this.confirmarSenha) {
      this.toastService.error('As senhas não coincidem!');
      return;
    }

    if (!this.token) {
      this.toastService.error('Token inválido.');
      return;
    }

    this.isLoading = true;
    this.authService.atualizarSenha(this.token, this.novaSenha).subscribe({
      next: (res: ApiResponse) => {
        this.isLoading = false;
        if (res.message && !res.error) {
          this.toastService.success(res.message);
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 3200);
        } else {
          this.toastService.error(res.error || 'Erro ao atualizar a senha.');
        }
      },
      error: () => {
        this.isLoading = false;
        this.toastService.error('Erro interno. Tente novamente mais tarde.');
      }
    });
  }
}
