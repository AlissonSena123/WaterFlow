import { Component, AfterViewInit, HostListener } from '@angular/core';
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
export class SobreComponent implements AfterViewInit {
  menuOpen = false;
  isScrolled = false;

  constructor(private router: Router) {}

  ngAfterViewInit(): void {
    AOS.init();
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
}
