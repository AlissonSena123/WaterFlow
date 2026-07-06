import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService, UsuarioAdmin } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-admin-usuarios',
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css'],
  standalone: false
})
export class UsuariosComponent implements OnInit, OnDestroy {
  usuarios: UsuarioAdmin[] = [];
  
  nomeFilter = '';
  roleFilter = '';

  private filterSubject = new Subject<void>();
  private filterSub!: Subscription;

  constructor(
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.filterSub = this.filterSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(() => {
      this.carregarUsuarios();
    });

    this.carregarUsuarios();
  }

  ngOnDestroy(): void {
    if (this.filterSub) this.filterSub.unsubscribe();
  }

  onFilterChange(): void {
    this.filterSubject.next();
  }

  carregarUsuarios(): void {
    const params: any = {};
    if (this.nomeFilter) params.nome = this.nomeFilter;
    if (this.roleFilter) params.role = this.roleFilter;

    this.authService.getUsuarios(params).subscribe({
      next: (res: { success: boolean; data?: UsuarioAdmin[]; erro?: string }) => {
        if (res.success && res.data) {
          this.usuarios = res.data;
        } else {
          this.usuarios = [];
        }
      },
      error: () => {
        this.toastService.error('Erro ao buscar usuários');
        this.usuarios = [];
      }
    });
  }

  getIniciais(nome: string): string {
    if (!nome) return '';
    return nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  }
}

