import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email = '';
  senha = '';
  mostrarSenha = false;
  isLoading = false;

  constructor(
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router
  ) {}

  onSubmit(): void {
    if (!this.email || !this.senha) {
      this.toastService.error('Preencha todos os campos');
      return;
    }

    this.isLoading = true;

    this.authService.login({ email: this.email, senha: this.senha }).subscribe({
      next: (data) => {
        this.isLoading = false;
        if (data.success && data.redirect) {
          this.router.navigateByUrl(data.redirect);
        } else {
          this.toastService.error(data.message || 'Erro ao fazer login');
        }
      },
      error: () => {
        this.isLoading = false;
        this.toastService.error('Erro ao conectar com o servidor');
      }
    });
  }

  toggleSenha(): void {
    this.mostrarSenha = !this.mostrarSenha;
  }
}
