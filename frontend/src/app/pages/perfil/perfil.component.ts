import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../shared/header/header.component';
import { AuthService } from '../../services/auth.service';
import { ReporteService, Reporte } from '../../services/reporte.service';
import { ViaCepService } from '../../services/via-cep.service';
import { ToastService } from '../../services/toast.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.css']
})
export class PerfilComponent implements OnInit {
  user: any = null;
  reportes: Reporte[] = [];
  totalReportes = 0;
  idade = 0;
  iniciais = '';

  modalEditVisible = false;
  modalDeletarVisible = false;
  
  editForm = {
    nome_completo: '',
    email: '',
    telefone: '',
    cep: '',
    bairro: ''
  };

  constructor(
    private authService: AuthService,
    private reporteService: ReporteService,
    private viaCepService: ViaCepService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.carregarPerfil();
  }

  carregarPerfil(): void {
    this.authService.me().subscribe({
      next: (data) => {
        if (!data || !data.user) {
          this.router.navigate(['/login']);
          return;
        }
        this.user = data.user;
        this.calcularIdade();
        this.gerarIniciais();
        this.carregarReportes();
      },
      error: () => this.router.navigate(['/login'])
    });
  }

  carregarReportes(): void {
    if (!this.user?.email) return;

    this.reporteService.contagemReportes(this.user.email).subscribe(res => {
      this.totalReportes = res.total || 0;
    });

    this.reporteService.meusReportes(this.user.email).subscribe(res => {
      this.reportes = res.reportes || [];
    });
  }

  calcularIdade(): void {
    if (!this.user?.nascimento) return;
    const [ano, mes, dia] = this.user.nascimento.split('-');
    const nascimento = new Date(`${ano}-${mes}-${dia}`);
    const hoje = new Date();
    
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mesPassou = hoje.getMonth() > nascimento.getMonth();
    const diaPassou = hoje.getMonth() === nascimento.getMonth() && hoje.getDate() >= nascimento.getDate();
    
    if (!mesPassou && !diaPassou) idade--;
    this.idade = idade;
  }

  gerarIniciais(): void {
    if (!this.user?.nome) return;
    this.iniciais = this.user.nome.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  }

  abrirModalEdit(): void {
    this.editForm = {
      nome_completo: this.user.nome || '',
      email: this.user.email || '',
      telefone: this.user.telefone || '',
      cep: '',
      bairro: this.user.bairro || ''
    };
    this.modalEditVisible = true;
  }

  fecharModalEdit(): void {
    this.modalEditVisible = false;
  }

  abrirModalDeletar(): void {
    this.modalDeletarVisible = true;
  }

  fecharModalDeletar(): void {
    this.modalDeletarVisible = false;
  }

  buscarCEP(): void {
    const cep = this.editForm.cep?.trim();
    if (!cep) return;
    this.viaCepService.buscarCEP(cep).subscribe({
      next: (data) => {
        if (data.localidade !== 'Salvador') {
          this.toastService.error('Apenas CEPs de Salvador são permitidos');
          return;
        }
        this.editForm.bairro = data.bairro || '';
      },
      error: () => this.toastService.error('Erro ao buscar CEP')
    });
  }

  confirmarAtualizacao(): void {
    const payload: any = {};
    if (this.editForm.nome_completo.trim()) payload.nome_completo = this.editForm.nome_completo.trim();
    if (this.editForm.email.trim()) payload.email = this.editForm.email.trim();
    if (this.editForm.telefone.trim()) payload.telefone = this.editForm.telefone.trim();
    if (this.editForm.bairro.trim()) payload.bairro = this.editForm.bairro.trim();

    this.authService.atualizarPerfil(payload).subscribe({
      next: (data) => {
        if (!data.success) {
          this.toastService.error(data.message || 'Erro ao atualizar perfil');
          return;
        }
        this.toastService.success('Perfil atualizado com sucesso');
        this.carregarPerfil();
        this.fecharModalEdit();
      },
      error: () => this.toastService.error('Erro ao atualizar perfil')
    });
  }

  deletarConta(): void {
    this.authService.deletarConta().subscribe({
      next: (data) => {
        if (data.success) {
          this.toastService.success(data.message || 'Conta deletada');
          setTimeout(() => this.router.navigate(['/login']), 1200);
        } else {
          this.toastService.error(data.message || 'Erro ao deletar conta');
        }
      },
      error: () => this.toastService.error('Erro de conexão')
    });
  }

  formatarTelefone(tel: string): string {
    if (!tel) return '';
    const n = tel.replace(/\D/g, '');
    return n.length <= 10
      ? n.replace(/^(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
      : n.replace(/^(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }

  formatarData(data: string): string {
    if (!data) return '';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  }
}
