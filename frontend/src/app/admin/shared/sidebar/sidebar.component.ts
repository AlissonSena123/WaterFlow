import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  standalone: false
})
export class SidebarComponent {
  expand = false;
  openMobile = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  toggleExpand(): void {
    this.expand = !this.expand;
  }

  toggleMobile(): void {
    this.openMobile = !this.openMobile;
  }

  closeMobile(): void {
    this.openMobile = false;
  }

  logout(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }
}
