import { Component, OnInit, OnDestroy } from '@angular/core';
import { ReporteService, Reporte } from '../../services/reporte.service';
import { ToastService } from '../../services/toast.service';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-admin-relatorios',
  templateUrl: './relatorios.component.html',
  styleUrls: ['./relatorios.component.css'],
  standalone: false
})
export class RelatoriosComponent implements OnInit, OnDestroy {
  relatorios: Reporte[] = [];
  
  buscaFilter = '';
  statusFilter = '';

  private filterSubject = new Subject<void>();
  private filterSub!: Subscription;

  constructor(
    private reporteService: ReporteService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.filterSub = this.filterSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(() => {
      this.carregarRelatorios();
    });

    this.carregarRelatorios();
  }

  ngOnDestroy(): void {
    if (this.filterSub) this.filterSub.unsubscribe();
  }

  onFilterChange(): void {
    this.filterSubject.next();
  }

  carregarRelatorios(): void {
    const params: any = {};
    if (this.buscaFilter) params.busca = this.buscaFilter;
    if (this.statusFilter) params.status = this.statusFilter;

    this.reporteService.getRelatorios(params).subscribe({
      next: (res: { success: boolean; data?: Reporte[]; erro?: string }) => {
        if (res.success && res.data) {
          this.relatorios = res.data;
        } else {
          this.relatorios = [];
        }
      },
      error: () => {
        this.toastService.error('Erro ao buscar relatórios');
        this.relatorios = [];
      }
    });
  }

  getIniciais(nome: string): string {
    if (!nome) return '';
    return nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  }
}

