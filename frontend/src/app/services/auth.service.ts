import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LoginPayload { email: string; senha: string; }
export interface CadastroPayload {
  nome_completo: string; data_nascimento: string; email: string;
  senha: string; telefone: string; cidade: string; estado: string;
  pais: string; bairro: string;
}
export interface ApiResponse { success: boolean; message?: string; redirect?: string; error?: string; }
export interface MeResponse {
  tipo: 'users' | 'funcionario' | null;
  user: any | null;
}
export interface UsuarioAdmin {
  id: string;
  nome_completo: string;
  email: string;
  telefone?: string;
  bairro?: string;
  role?: string;
  created_at?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient) {}

  login(payload: LoginPayload): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('/login', payload, { withCredentials: true });
  }

  cadastrar(payload: CadastroPayload): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('/cadastrar', payload, { withCredentials: true });
  }

  me(): Observable<MeResponse> {
    return this.http.get<MeResponse>('/me', { withCredentials: true });
  }

  logout(): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('/logout', {}, { withCredentials: true });
  }

  atualizarPerfil(dados: any): Observable<ApiResponse> {
    return this.http.patch<ApiResponse>('/usuarios/atualizar/perfil', dados, { withCredentials: true });
  }

  deletarConta(): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>('/usuarios/deletar', { withCredentials: true });
  }

  esqueciSenha(email: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>('/redefinirSenha', { email }, { withCredentials: true });
  }

  atualizarSenha(token: string, senha: string): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`/usuarios/atualizar-senha/${token}`, { senha }, { withCredentials: true });
  }

  validarTokenSenha(token: string): Observable<{ success: boolean; email?: string; message?: string }> {
    return this.http.get<{ success: boolean; email?: string; message?: string }>(`/api/validar-token-senha/${token}`, { withCredentials: true });
  }

  getUsuarios(params?: any): Observable<{ success: boolean; data?: UsuarioAdmin[]; erro?: string }> {
    return this.http.get<{ success: boolean; data?: UsuarioAdmin[]; erro?: string }>('/api/usuarios', { params, withCredentials: true });
  }
}
