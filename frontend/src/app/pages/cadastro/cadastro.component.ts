import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ViaCepService } from '../../services/via-cep.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-cadastro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './cadastro.component.html',
  styleUrls: ['./cadastro.component.css']
})
export class CadastroComponent implements OnInit {
  form = {
    nome_completo: '',
    email: '',
    senha: '',
    data_nascimento: '',
    telefone: '',
    cidade: '',
    estado: '',
    pais: '',
    bairro: '',
    cep: ''
  };

  maxDate = '';
  minDate = '';
  isLoading = false;
  cepErro = '';

  readonly tiposProblem = [
    { value: 'SEM ÁGUA', label: 'Sem Água' },
    { value: 'PRESSÃO BAIXA', label: 'Pressão Baixa' },
    { value: 'VAZAMENTO', label: 'Vazamento' },
    { value: 'OUTRO', label: 'Outro' }
  ];

  constructor(
    private authService: AuthService,
    private viaCepService: ViaCepService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const hoje = new Date();
    this.maxDate = hoje.toISOString().split('T')[0];
    const minDate = new Date(hoje.getFullYear() - 120, hoje.getMonth(), hoje.getDate());
    this.minDate = minDate.toISOString().split('T')[0];
  }

  onCepBlur(): void {
    const cep = this.form.cep?.trim();
    if (!cep) return;
    this.cepErro = '';

    this.viaCepService.buscarCEP(cep).subscribe({
      next: (data) => {
        if (data.erro) {
          this.limparEndereco();
          this.toastService.error('CEP inválido');
          return;
        }
        if (data.localidade !== 'Salvador') {
          this.limparEndereco();
          this.toastService.error('Apenas CEPs de Salvador são permitidos');
          return;
        }
        this.form.cidade = data.localidade || '';
        this.form.bairro = data.bairro || '';
        this.form.estado = data.uf || '';
        this.form.pais = 'Brasil';
      },
      error: () => {
        this.toastService.error('Erro ao buscar CEP');
      }
    });
  }

  formatarTelefone(event: Event): void {
    const input = event.target as HTMLInputElement;
    let tel = input.value.replace(/\D/g, '');
    if (tel.length < 10) {
      tel = tel.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    } else {
      tel = tel.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
    }
    this.form.telefone = tel;
  }

  onSubmit(): void {
    const { data_nascimento, cep, ...payload } = this.form;

    if (!data_nascimento || data_nascimento > this.maxDate || data_nascimento < this.minDate) {
      this.toastService.error('Data de nascimento inválida');
      return;
    }

    this.isLoading = true;
    const sendPayload = { ...payload, data_nascimento };

    this.authService.cadastrar(sendPayload as any).subscribe({
      next: (data) => {
        this.isLoading = false;
        if (data.success) {
          this.toastService.success(data.message || 'Cadastro realizado com sucesso!');
          setTimeout(() => this.router.navigate(['/login']), 3000);
        } else {
          this.toastService.error(data.message || 'Erro ao cadastrar');
        }
      },
      error: () => {
        this.isLoading = false;
        this.toastService.error('Erro interno do servidor');
      }
    });
  }

  private limparEndereco(): void {
    this.form.cidade = '';
    this.form.bairro = '';
    this.form.estado = '';
    this.form.pais = '';
  }
}
