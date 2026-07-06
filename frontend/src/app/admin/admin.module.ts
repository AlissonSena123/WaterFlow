import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AdminRoutingModule } from './admin-routing.module';
import { DashboardComponent } from './dashboard/dashboard.component';
import { PoligonosComponent } from './poligonos/poligonos.component';
import { RelatoriosComponent } from './relatorios/relatorios.component';
import { UsuariosComponent } from './usuarios/usuarios.component';
import { SidebarComponent } from './shared/sidebar/sidebar.component';
import { AdminReporteComponent } from './reporte/admin-reporte.component';
import { AdminLayoutComponent } from './layout/admin-layout.component';

@NgModule({
  declarations: [
    DashboardComponent,
    PoligonosComponent,
    RelatoriosComponent,
    UsuariosComponent,
    SidebarComponent,
    AdminReporteComponent,
    AdminLayoutComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    AdminRoutingModule
  ]
})
export class AdminModule { }
