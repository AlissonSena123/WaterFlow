import { Component, AfterViewInit, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import * as AOS from 'aos';

@Component({
  selector: 'app-sobre',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sobre.component.html',
  styleUrls: ['./sobre.component.css']
})
export class SobreComponent implements OnInit, AfterViewInit, OnDestroy {
  menuOpen = false;
  isScrolled = false;

  slides = [
    { imagem: '/assets/Img/tela_inicial.png', titulo: 'Mapa Interativo', descricao: 'Acompanhe em tempo real a situação do abastecimento no seu bairro.' },
    { imagem: '/assets/Img/bairro_selecionado_notificacao.png', titulo: 'Detalhes e Notificações', descricao: 'Veja o status detalhado do seu bairro e receba atualizações em tempo real.' },
    { imagem: '/assets/Img/tela_reporte.png', titulo: 'Reportar Falta d\'Água', descricao: 'Registre problemas em segundos e acompanhe o andamento da resolução.' },
    { imagem: '/assets/Img/tela_perfil.png', titulo: 'Seu Perfil', descricao: 'Gerencie seus dados e acompanhe seu histórico de reportes em um só lugar.' },
  ];
  
  slideAtual = 0;
  private autoplayInterval: any;

  constructor(private router: Router) { }

  ngOnInit(): void {
    this.autoplayInterval = setInterval(() => this.nextSlide(), 5000);
  }

  ngAfterViewInit(): void {
    AOS.init();
  }

  ngOnDestroy(): void {
    if (this.autoplayInterval) clearInterval(this.autoplayInterval);
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 0;
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  irParaLogin(): void {
    this.router.navigate(['/login']);
  }

  irParaCadastro(): void {
    this.router.navigate(['/cadastro']);
  }

  nextSlide(): void {
    this.slideAtual = (this.slideAtual + 1) % this.slides.length;
  }

  prevSlide(): void {
    this.slideAtual = (this.slideAtual - 1 + this.slides.length) % this.slides.length;
  }

  irParaSlide(i: number): void {
    this.slideAtual = i;
  }
}