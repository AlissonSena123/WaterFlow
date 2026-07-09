import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificacaoService, NotifReporte, NotifAlerta } from '../../services/notificacao.service';
import { ToastService } from '../../services/toast.service';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Input() activePage: 'mapa' | 'reporte' | 'perfil' = 'mapa';

  notifOpen = false;
  perfilOpen = false;
  mobileOpen = false;

  notifVisiveis: any[] = [];
  notifReportes: NotifReporte[] = [];
  notifAlertas: NotifAlerta[] = [];
  notifLidas: Record<string, string[]> = { reportes: [], alertas: [] };
  totalNaoLidas = 0;

  private CHAVE_REPORTES = 'notif_reportes';
  private CHAVE_ALERTAS = 'notif_alertas';
  private pollSub!: Subscription;

  constructor(
    private authService: AuthService,
    private notifService: NotificacaoService,
    private toastService: ToastService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.carregarNotificacoes();
    // Polling a cada 5 segundos
    this.pollSub = interval(5000).pipe(
      switchMap(() => this.notifService.meusReportes())
    ).subscribe();
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  carregarNotificacoes(): void {
    this.notifService.meusReportes().subscribe(res => {
      if (res.success) this.notifReportes = res.data;
      this.calcBadge();
      this.atualizarNotifVisiveis();
    });

    this.notifService.alertasBairro().subscribe(res => {
      if (res.success) this.notifAlertas = res.data;
      this.calcBadge();
      this.atualizarNotifVisiveis();
    });
  };

  calcBadge(): void {
    const lidasR = this.getLidas(this.CHAVE_REPORTES);
    const lidasA = this.getLidas(this.CHAVE_ALERTAS);
    const naoLidasR = this.notifReportes.filter(n => !lidasR.includes(String(n.id))).length;
    const naoLidasA = this.notifAlertas.filter(n => !lidasA.includes(`${n.id}_${n.atualizado_em}`)).length;
    this.totalNaoLidas = naoLidasR + naoLidasA;
  }

  private atualizarNotifVisiveis(): void {
    const lidasR = this.getLidas(this.CHAVE_REPORTES);
    const lidasA = this.getLidas(this.CHAVE_ALERTAS);
    const r = this.notifReportes.filter(n => !lidasR.includes(String(n.id))).map(n => ({ ...n, tipo: 'reporte' }));
    const a = this.notifAlertas.filter(n => !lidasA.includes(`${n.id}_${n.atualizado_em}`)).map(n => ({ ...n, tipo: 'alerta' }));
    this.notifVisiveis = [...a, ...r];
  }

  dispensarNotif(notif: any, event: MouseEvent): void {
    event.stopPropagation();
    if (notif.tipo === 'reporte') {
      this.marcarLida(this.CHAVE_REPORTES, String(notif.id));
    } else {
      this.marcarLida(this.CHAVE_ALERTAS, `${notif.id}_${notif.atualizado_em}`);
    }
    this.calcBadge();
    this.atualizarNotifVisiveis();
  }

  formatarData(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  }

  toggleNotif(e: MouseEvent): void {
    e.stopPropagation();
    this.notifOpen = !this.notifOpen;
    if (this.notifOpen) this.perfilOpen = false;
  }

  togglePerfil(e: MouseEvent): void {
    e.stopPropagation();
    this.perfilOpen = !this.perfilOpen;
    if (this.perfilOpen) this.notifOpen = false;
  }

  toggleMobile(): void {
    this.mobileOpen = !this.mobileOpen;
  }

  fecharDropdowns(): void {
    this.notifOpen = false;
    this.perfilOpen = false;
  }

  logout(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }

  private getLidas(key: string): string[] {
    return JSON.parse(localStorage.getItem(key) || '[]');
  }

  private marcarLida(key: string, id: string): void {
    const lidas = this.getLidas(key);
    if (!lidas.includes(id)) {
      lidas.push(id);
      const limitado = lidas.length > 100 ? lidas.slice(-100) : lidas;
      localStorage.setItem(key, JSON.stringify(limitado));
    }
  }
}
