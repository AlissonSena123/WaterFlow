import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { AuthService, MeResponse } from '../../services/auth.service';
import { MapaService, StatusBairro } from '../../services/mapa.service';
import { ToastService } from '../../services/toast.service';
import * as maplibregl from 'maplibre-gl';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  standalone: false
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;

  adminLogged = '';
  statusFalta = 0;
  statusIrregular = 0;
  statusNormal = 0;
  bairrosComProblema: StatusBairro[] = [];

  map!: maplibregl.Map;
  private mapReady = false;

  constructor(
    private authService: AuthService,
    private mapaService: MapaService,
    private toastService: ToastService
  ) { }

  private focusListener = () => {
    this.loadStatusBairros();
  };

  ngOnInit(): void {
    this.authService.me().subscribe((res: MeResponse) => {
      if (res && res.user) {
        this.adminLogged = res.user.nome_completo || res.user.nome || '';
      }
    });

    this.loadStatusBairros();
    window.addEventListener('focus', this.focusListener);
  }

  ngAfterViewInit(): void {
    this.mapaService.getMapKey().subscribe({
      next: (res: { key: string }) => {
        this.initMap(res.key);
      },
      error: () => this.toastService.error('Erro ao buscar chave do mapa')
    });
  }

  ngOnDestroy(): void {
    if (this.map) this.map.remove();
    window.removeEventListener('focus', this.focusListener);
  }

  loadStatusBairros(): void {
    this.mapaService.getStatusBairros().subscribe({
      next: (data: StatusBairro[]) => {
        this.statusFalta = data.filter((b: StatusBairro) => b.status === 'SEM_ABASTECIMENTO').length;
        this.statusIrregular = data.filter((b: StatusBairro) => b.status === 'FORNECIMENTO_IRREGULAR').length;
        this.statusNormal = data.filter((b: StatusBairro) => b.status === 'NORMAL').length;

        this.bairrosComProblema = data.filter((b: StatusBairro) => b.status !== 'NORMAL');

        // Only update map if fully ready (source + layers added)
        if (this.mapReady) {
          this.updateMapColors(data);
        }
      },
      error: () => this.toastService.error('Erro ao carregar status')
    });
  }

  initMap(key: string): void {
    this.map = new maplibregl.Map({
      container: this.mapContainer.nativeElement,
      style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${key}`,
      center: [-38.5167, -12.9704],
      zoom: 12,
      minZoom: 10,
      maxZoom: 16,
      maxBounds: [
        [-38.70, -13.20],
        [-38.20, -12.70]
      ]
    });

    this.map.on('load', () => {
      fetch('/assets/mapas/salvador_bairros.geojson')
        .then(res => res.json())
        .then(data => {
          // Adiciona um campo normalizado em cada feature, pra bater exatamente com o backend
          data.features.forEach((f: any) => {
            f.properties.ID_NORMALIZADO = this.normalizarTexto(f.properties.NM_BAIRRO);
          });

          this.map.addSource('municipios', {
            type: 'geojson',
            data: data,
            promoteId: 'ID_NORMALIZADO'
          });

          this.map.addLayer({
            id: 'municipios-fill',
            type: 'fill',
            source: 'municipios',
            paint: {
              'fill-color': [
                'match',
                ['feature-state', 'status'],
                'SEM_ABASTECIMENTO', '#ff0000',
                'FORNECIMENTO_IRREGULAR', '#ff7700',
                'NORMAL', '#00cc66',
                '#999999'
              ],
              'fill-opacity': 0.6
            }
          });

          this.map.addLayer({
            id: 'municipios-line',
            type: 'line',
            source: 'municipios',
            paint: {
              'line-color': '#ffffff',
              'line-width': 1
            }
          });

          // Mark map as ready THEN load colors
          this.mapReady = true;
          this.mapaService.getStatusBairros().subscribe((statusData: StatusBairro[]) => {
            this.updateMapColors(statusData);
          });
        });
    });
  }

  updateMapColors(statusData: StatusBairro[]): void {
    if (!this.mapReady || !this.map || !this.map.isStyleLoaded()) return;

    statusData.forEach((item: StatusBairro) => {
      if (item.bairro) {
        this.map.setFeatureState(
          { source: 'municipios', id: this.normalizarTexto(item.bairro) },  // ← normalizado igual ao GeoJSON
          { status: item.status }
        );
      }
    });
  }

  formatStatus(status: string): string {
    return status.replace(/_/g, ' ');
  }

  private normalizarTexto(texto: string): string {
    return texto
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
