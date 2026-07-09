import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, forkJoin, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError, map } from 'rxjs/operators';
import { HeaderComponent } from '../../shared/header/header.component';
import { MapaService, StatusBairro } from '../../services/mapa.service';
import { ToastService } from '../../services/toast.service';
import * as maplibregl from 'maplibre-gl';
import * as turf from '@turf/turf';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.css']
})
export class InicioComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;

  map!: maplibregl.Map;
  searchTerm = '';
  searchSubject = new Subject<string>();
  suggestions: string[] = [];

  municipiosData: any = null;
  listaBairros: string[] = [];
  statusBairros: StatusBairro[] = [];

  cardData: StatusBairro[] | null = null;
  nomeExibicao = '';
  cardVisible = false;
  cliqueNoBairro = false;

  private searchSub!: Subscription;

  constructor(
    private mapaService: MapaService,
    private toastService: ToastService,
    private ngZone: NgZone
  ) { }

  ngOnInit(): void {
    // Setup RxJS for search autocomplete
    this.searchSub = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      map(term => this.normalizarTexto(term))
    ).subscribe(term => {
      this.updateSuggestions(term);
    });
  }

  ngAfterViewInit(): void {
    this.mapaService.getMapKey().subscribe({
      next: (res) => {
        this.initMap(res.key);
      },
      error: () => {
        this.toastService.error('Erro ao buscar chave do mapa');
      }
    });
  }

  ngOnDestroy(): void {
    if (this.searchSub) this.searchSub.unsubscribe();
    if (this.map) this.map.remove();
  }

  onSearchInput(value: string): void {
    this.searchTerm = value;
    this.searchSubject.next(value);
  }

  onSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.suggestions = [];
      this.buscarRegiao(this.searchTerm);
    }
  }

  onSuggestionClick(nome: string): void {
    this.searchTerm = nome;
    this.suggestions = [];
    this.buscarRegiao(nome);
  }

  hideSuggestions(): void {
    setTimeout(() => this.suggestions = [], 200);
  }

  updateSuggestions(term: string): void {
    if (!term || !this.listaBairros.length) {
      this.suggestions = [];
      return;
    }
    const comecaCom = this.listaBairros.filter(nome => this.normalizarTexto(nome).startsWith(term));
    const contemTexto = this.listaBairros.filter(nome =>
      this.normalizarTexto(nome).includes(term) && !this.normalizarTexto(nome).startsWith(term)
    );
    this.suggestions = [...comecaCom, ...contemTexto].slice(0, 8);
  }

  private initMap(key: string): void {
    this.ngZone.runOutsideAngular(() => {
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
            this.municipiosData = data;
            this.listaBairros = [...new Set(data.features.map((f: any) => f.properties.NM_BAIRRO))] as string[];

            this.map.addSource('municipios', {
              type: 'geojson',
              data: data,
              promoteId: 'NM_BAIRRO'
            });

            this.map.addLayer({
              id: 'municipios-layer',
              type: 'fill',
              source: 'municipios',
              paint: {
                'fill-color': '#aeffd500',
                'fill-opacity': 0.35,
                'fill-outline-color': '#003366'
              }
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
                  '#aeffd500'
                ],
                'fill-opacity': 0.2
              },
              filter: ['==', ['get', 'NM_BAIRRO'], '']
            });

            this.map.addLayer({
              id: 'municipios-line',
              type: 'line',
              source: 'municipios',
              paint: {
                'line-color': '#ffe4e4',
                'line-width': 2
              },
              filter: ['==', ['get', 'NM_BAIRRO'], '']
            });

            this.ngZone.run(() => this.loadStatusBairros());
          });
      });

      this.map.on('click', 'municipios-layer', (e: maplibregl.MapLayerMouseEvent) => {
        this.cliqueNoBairro = true;
        if (!e.features || e.features.length === 0) return;
        const nomeMunicipio = e.features[0].properties['NM_BAIRRO'];
        this.ngZone.run(() => {
          this.searchTerm = nomeMunicipio;
          this.buscarRegiao(nomeMunicipio);
        });
      });

      this.map.on('click', (e: maplibregl.MapMouseEvent) => {
        if (!this.cliqueNoBairro && this.cardVisible) {
          this.ngZone.run(() => this.closeCard());
        }
        this.cliqueNoBairro = false;
      });
    });
  }

  loadStatusBairros(): void {
    this.mapaService.getStatusBairros().subscribe({
      next: (data) => {
        this.statusBairros = data;
      }
    });
  }

  buscarRegiao(nome: string): void {
    if (!nome) {
      this.toastService.error('Digite um bairro');
      return;
    }
    if (!this.municipiosData) {
      this.toastService.error('Mapa ainda carregando');
      return;
    }

    const nomeBusca = this.normalizarTexto(nome);
    const feature = this.municipiosData.features.find((f: any) =>
      this.normalizarTexto(f.properties.NM_BAIRRO) === nomeBusca
    );

    if (!feature) {
      this.toastService.error('Bairro não encontrado');
      return;
    }

    this.nomeExibicao = feature.properties.NM_BAIRRO;

    forkJoin({
      statusGeral: this.statusBairros.length ? of(this.statusBairros) : this.mapaService.getStatusBairros(),
      detalhes: this.mapaService.getDetalhesBairro(nomeBusca)
    }).subscribe({
      next: (res) => {
        this.statusBairros = res.statusGeral;
        this.cardData = res.detalhes;

        const bairroStatus = this.statusBairros.find(b => this.normalizarTexto(b.bairro) === nomeBusca);
        const cor = this.resolverCor(bairroStatus?.status);

        this.map.setPaintProperty('municipios-fill', 'fill-color', cor);
        this.map.setPaintProperty('municipios-line', 'line-color', cor);
        this.map.setFilter('municipios-fill', ['==', ['get', 'NM_BAIRRO'], this.nomeExibicao]);
        this.map.setFilter('municipios-line', ['==', ['get', 'NM_BAIRRO'], this.nomeExibicao]);

        const centro = turf.centerOfMass(feature).geometry.coordinates as [number, number];
        const bbox = turf.bbox(feature) as [number, number, number, number];

        this.map.fitBounds(bbox, { padding: 40, duration: 1000 });
        this.map.flyTo({ center: centro, zoom: 13.5, speed: 1.2, curve: 1.4, essential: true });

        setTimeout(() => {
          if (this.cardData && this.cardData.length > 0) {
            this.cardVisible = true;
          } else {
            this.toastService.error('Informações não encontradas');
          }
        }, 800);
      },
      error: () => this.toastService.error('Erro ao buscar dados do bairro')
    });
  }

  closeCard(): void {
    this.cardVisible = false;
  }

  // Utilities
  private normalizarTexto(texto: string): string {
    return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
  }

  resolverCor(status?: string): string {
    const s = status?.toUpperCase();
    if (s === 'NORMAL') return '#22c55e';
    if (s === 'SEM_ABASTECIMENTO') return '#ef4444';
    if (s === 'FORNECIMENTO_IRREGULAR') return '#f97316';
    return '#3b3737';
  }

  colorStatus(status: string): string {
    const s = status.toUpperCase();
    if (s === 'NORMAL') return 'badge-active';
    if (s === 'SEM_ABASTECIMENTO') return 'badge-high';
    if (s === 'FORNECIMENTO_IRREGULAR') return 'badge-med';
    return '';
  }

  formatStatusStr(status: string): string {
    return status.replace(/_/g, ' ');
  }

  formatDateStr(dateStr?: string, status?: string): string | null {
    if (status === 'NORMAL') return null;
    if (!dateStr) return null;
    const isUTC = dateStr.includes('T') ? false : true;
    const finalStr = isUTC ? dateStr + 'Z' : dateStr.replace(' ', 'T');
    const d = new Date(finalStr);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}
