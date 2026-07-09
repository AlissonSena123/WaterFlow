import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface StatusBairro {

  id: number;

  bairro: string;

  bairroExibicao?: string;

  status: string;

  inicio_interrupcao?: string;

  previsao_retorno?: string;

  causa_interrupcao?: string;

  area_afetada?: string;

  pressao_rede?: string;

  medida_solucao?: string;

  descricao?: string;

  atualizado_em: string;

}

@Injectable({ providedIn: 'root' })
export class MapaService {
  constructor(private http: HttpClient) { }

  getMapKey(): Observable<{ key: string }> {
    return this.http.get<{ key: string }>('/api/mapKey');
  }

  getStatusBairros(): Observable<StatusBairro[]> {
    return this.http.get<StatusBairro[]>('/status/bairro');
  }

  getDetalhesBairro(bairro: string): Observable<StatusBairro[]> {
    return this.http.get<StatusBairro[]>(`/status/buscar/dados/${encodeURIComponent(bairro)}`);
  }

  // Admin
  updateDadosBairro(bairroNome: string, payload: any): Observable<any> {
    return this.http.put<any>(`/status/update/dados/${encodeURIComponent(bairroNome)}`, payload, { withCredentials: true });
  }

  getDashboardStats(): Observable<any> {
    return this.http.get<any>('/status/bairro', { withCredentials: true });
  }
}
