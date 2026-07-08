  import { Injectable } from '@angular/core';
  import { HttpClient } from '@angular/common/http';
  import { Observable } from 'rxjs';

  export interface Reporte {
    id: number;
    nome: string;
    email: string;
    tipo_problema: string;
    rua: string;
    bairro: string;
    descricao: string;
    status: string;
    created_at: string;
    resposta_admin?: string;
    respondido_em?: string;
  }

  export interface ReportePayload {
    nome: string;
    email: string;
    tipo: string;
    rua: string;
    bairro: string;
    descricao: string;
  }

  @Injectable({ providedIn: 'root' })
  export class ReporteService {
    constructor(private http: HttpClient) {}

    enviarReporte(payload: ReportePayload): Observable<any> {
      return this.http.post<any>('/reporte/enviar', payload, { withCredentials: true });
    }

    meusReportes(email: string): Observable<any> {
      return this.http.get<any>(`/meus-reportes/${email}`, { withCredentials: true });
    }

    contagemReportes(email: string): Observable<any> {
      return this.http.get<any>(`/reportes/contagem/${email}`, { withCredentials: true });
    }

    // Admin
    listarTodosReportes(): Observable<any> {
      return this.http.get<any>('/admin/api/reportes', { withCredentials: true });
    }

    getReports(params?: any): Observable<{ success: boolean; data?: Reporte[]; erro?: string }> {
      return this.http.get<{ success: boolean; data?: Reporte[]; erro?: string }>('/admin/api/reports', { params, withCredentials: true });
    }

    getRelatorios(params?: any): Observable<{ success: boolean; data?: Reporte[]; erro?: string }> {
      return this.http.get<{ success: boolean; data?: Reporte[]; erro?: string }>('/admin/api/relatorios', { params, withCredentials: true });
    }

    responderReporteAdmin(id: number, payload: { status: string, resposta: string }): Observable<any> {
      return this.http.post<any>(`/admin/api/reports/${id}/responder`, payload, { withCredentials: true });
    }
  }
