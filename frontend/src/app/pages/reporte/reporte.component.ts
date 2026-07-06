import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../shared/header/header.component';
import { AuthService } from '../../services/auth.service';
import { ReporteService } from '../../services/reporte.service';
import { ViaCepService } from '../../services/via-cep.service';
import { ToastService } from '../../services/toast.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-reporte',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './reporte.component.html',
  styleUrls: ['./reporte.component.css']
})
export class ReporteComponent implements OnInit {
  form = {
    nome: '',
    email: '',
    tipo_problema: '',
    cep: '',
    rua: '',
    bairro: '',
    descricao: ''
  };

  tiposProblema = [
    { value: 'SEM ÁGUA', label: 'Sem Água' },
    { value: 'PRESSÃO BAIXA', label: 'Pressão Baixa' },
    { value: 'VAZAMENTO', label: 'Vazamento' },
    { value: 'OUTRO', label: 'Outro' }
  ];

  isLoading = false;

  constructor(
    private authService: AuthService,
    private reporteService: ReporteService,
    private viaCepService: ViaCepService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.carregarDadosUsuario();
  }

  carregarDadosUsuario(): void {
    this.authService.me().subscribe({
      next: (data) => {
        if (data && data.user) {
          this.form.nome = data.user.nome;
          this.form.email = data.user.email;
        } else {
          this.router.navigate(['/login']);
        }
      },
      error: () => this.router.navigate(['/login'])
    });
  }

  buscarCEP(): void {
    const cep = this.form.cep?.trim();
    if (!cep) {
      this.form.rua = '';
      this.form.bairro = '';
      this.toastService.error('Digite o CEP');
      return;
    }

    this.viaCepService.buscarCEP(cep).subscribe({
      next: (data) => {
        if (data.erro || !data.bairro) {
          this.toastService.error('CEP inválido');
          return;
        }
        if (data.localidade !== 'Salvador') {
          this.toastService.error('Apenas CEPs de Salvador são permitidos');
          return;
        }
        this.form.rua = data.logradouro || '';
        this.form.bairro = data.bairro || '';
      },
      error: () => this.toastService.error('Erro ao buscar CEP')
    });
  }

  enviarReporte(): void {
    if (!this.form.tipo_problema || !this.form.cep || !this.form.descricao) {
      this.toastService.error('Preencha os campos obrigatórios');
      return;
    }

    this.isLoading = true;
    
    const payload = {
      nome: this.form.nome,
      email: this.form.email,
      tipo: this.form.tipo_problema,
      rua: this.form.rua,
      bairro: this.form.bairro,
      descricao: this.form.descricao
    };

    this.reporteService.enviarReporte(payload).subscribe({
      next: (data) => {
        this.isLoading = false;
        if (data.success) {
          this.toastService.success(data.message || 'Reporte enviado');
          // Reset form but keep name and email
          this.form.tipo_problema = '';
          this.form.cep = '';
          this.form.rua = '';
          this.form.bairro = '';
          this.form.descricao = '';
        } else {
          this.toastService.error(data.message || 'Erro ao enviar reporte');
        }
      },
      error: () => {
        this.isLoading = false;
        this.toastService.error('Erro ao conectar com o servidor');
      }
    });
  }
}
