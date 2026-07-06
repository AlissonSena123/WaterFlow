import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface NotifReporte {
  id: number;
  bairro: string;
  status: string;
  resposta_admin: string;
  respondido_em: string;
}

export interface NotifAlerta {
  id: number;
  bairro: string;
  status: string;
  atualizado_em: string;
}

@Injectable({ providedIn: 'root' })
export class NotificacaoService {
  constructor(private http: HttpClient) {}

  meusReportes(): Observable<{ success: boolean; data: NotifReporte[] }> {
    return this.http.get<any>('/api/meus-reportes', { withCredentials: true });
  }

  alertasBairro(): Observable<{ success: boolean; data: NotifAlerta[] }> {
    return this.http.get<any>('/api/alertas-bairro', { withCredentials: true });
  }
}
