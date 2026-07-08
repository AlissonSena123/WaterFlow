  import { Component, OnInit, OnDestroy } from '@angular/core';
  import { ReporteService, Reporte } from '../../services/reporte.service';
  import { ToastService } from '../../services/toast.service';
  import { Subject, Subscription } from 'rxjs';
  import { debounceTime } from 'rxjs/operators';

  @Component({
    selector: 'app-admin-reporte',
    templateUrl: './admin-reporte.component.html',
    styleUrls: ['./admin-reporte.component.css'],
    standalone: false
  })
  export class AdminReporteComponent implements OnInit, OnDestroy {
    reports: Reporte[] = [];
    
    // Filtros
    nomeFilter = '';
    dataFilter = '';
    bairroFilter = '';

    private filterSubject = new Subject<void>();
    private filterSub!: Subscription;

    // Modal
    modalVisible = false;
    reportSelecionado: Reporte | null = null;
    responderAberto = false;
    statusResposta = 'recebido';
    textoResposta = '';
    isSending = false;

    constructor(
      private reporteService: ReporteService,
      private toastService: ToastService
    ) {}

    ngOnInit(): void {
      this.filterSub = this.filterSubject.pipe(
        debounceTime(400)
      ).subscribe(() => {
        this.carregarReports();
      });

      this.carregarReports();
    }

    ngOnDestroy(): void {
      if (this.filterSub) this.filterSub.unsubscribe();
    }

    onFilterChange(): void {
      this.filterSubject.next();
    }

    carregarReports(): void {
      const params: any = {};
      if (this.nomeFilter) params.nome = this.nomeFilter;
      if (this.dataFilter) params.data = this.dataFilter;
      if (this.bairroFilter) params.bairro = this.bairroFilter;

      this.reporteService.getReports(params).subscribe({
        next: (res: { success: boolean; data?: Reporte[]; erro?: string }) => {
          if (res.success && res.data) {
            this.reports = res.data;
          } else {
            this.reports = [];
          }
        },
        error: () => {
          this.toastService.error('Erro ao buscar reportes');
          this.reports = [];
        }
      });
    }

    abrirDetalhes(report: Reporte): void {
      this.reportSelecionado = report;
      this.modalVisible = true;
      this.responderAberto = false;
      this.statusResposta = 'recebido';
      this.textoResposta = '';
    }

    fecharModal(): void {
      this.modalVisible = false;
      this.reportSelecionado = null;
    }

    toggleResponder(): void {
      this.responderAberto = !this.responderAberto;
    }

    enviarResposta(): void {
      if (!this.textoResposta.trim()) {
        this.toastService.error('Escreva uma mensagem antes de enviar.');
        return;
      }
      if (!this.reportSelecionado) return;

      this.isSending = true;
      const payload = {
        status: this.statusResposta,
        resposta: this.textoResposta
      };

      this.reporteService.responderReporteAdmin(this.reportSelecionado.id, payload).subscribe({
        next: (res: { success: boolean; erro?: string }) => {
          this.isSending = false;
          if (res.success) {
            this.toastService.success('Resposta enviada! Usuário notificado.');
            this.responderAberto = false;
            this.textoResposta = '';
            this.carregarReports(); // recarrega tabela
          } else {
            this.toastService.error(res.erro || 'Erro ao enviar resposta');
          }
        },
        error: () => {
          this.isSending = false;
          this.toastService.error('Erro de conexão');
        }
      });
    }

    getIniciais(nome: string): string {
      if (!nome) return '';
      return nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    }
  }
