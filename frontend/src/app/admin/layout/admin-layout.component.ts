import { Component, ViewChild } from '@angular/core';
import { SidebarComponent } from '../shared/sidebar/sidebar.component';

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css'],
  standalone: false
})
export class AdminLayoutComponent {
  @ViewChild(SidebarComponent) sidebar!: SidebarComponent;

  openMobileMenu(): void {
    if (this.sidebar) {
      this.sidebar.toggleMobile();
    }
  }
}
