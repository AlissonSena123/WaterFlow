import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CepResponse {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ViaCepService {
  constructor(private http: HttpClient) {}

  buscarCEP(cep: string): Observable<CepResponse> {
    const cepLimpo = cep.replace(/\D/g, '');
    return this.http.get<CepResponse>(`https://viacep.com.br/ws/${cepLimpo}/json/`);
  }
}
