import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { MapaService, StatusBairro } from '../../services/mapa.service';
import { ToastService } from '../../services/toast.service';
import * as maplibregl from 'maplibre-gl';
import * as turf from '@turf/turf';

@Component({
  selector: 'app-admin-poligonos',
  templateUrl: './poligonos.component.html',
  styleUrls: ['./poligonos.component.css'],
  standalone: false
})
export class PoligonosComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;

  map!: maplibregl.Map;
  private mapReady = false;
  municipiosData: any = null;

  searchTerm = '';
  painelStatusVisible = false;
  painelUpdateVisible = false;

  bairroSelecionado: StatusBairro | null = null;

  // Update Form
  formData = {
    idBairro: '',
    bairroExibicao: '',
    status: '',
    causa: '',
    inicio: '',
    retorno: '',
    area: '',
    pressao: '',
    medida: '',
    descricao: ''
  };

  constructor(
    private mapaService: MapaService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void { }

  ngAfterViewInit(): void {
    this.mapaService.getMapKey().subscribe({
      next: (res: { key: string }) => this.initMap(res.key),
      error: () => this.toastService.error('Erro ao carregar mapa')
    });
  }

  ngOnDestroy(): void {
    if (this.map) this.map.remove();
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
          data.features.forEach((f: any) => {
            f.properties.ID_NORMALIZADO = this.normalizarTexto(f.properties.NM_BAIRRO);
          });
          this.municipiosData = data;
          
          this.map.addSource('municipios', {
            type: 'geojson',
            data: data,
            promoteId: 'ID_NORMALIZADO'
          });

          this.map.addLayer({
            id: 'municipios-layer',
            type: 'fill',
            source: 'municipios',
            paint: {
              'fill-color': [
                'match',
                ['feature-state', 'status'],
                'SEM_ABASTECIMENTO', '#ff0000',
                'FORNECIMENTO_IRREGULAR', '#ff7700',
                'NORMAL', '#00cc66',
                '#aeffd5'
              ],
              'fill-opacity': 0.35,
              'fill-outline-color': '#003366'
            }
          });

          this.map.addLayer({
            id: 'municipios-layer-highlight',
            type: 'fill',
            source: 'municipios',
            paint: {
              'fill-color': '#0ec49d',
              'fill-opacity': 0.2
            },
            filter: ['==', ['get', 'NM_BAIRRO'], '']
          });

          this.map.addLayer({
            id: 'municipios-line',
            type: 'line',
            source: 'municipios',
            paint: {
              'line-color': '#2c2927',
              'line-width': 2
            },
            filter: ['==', ['get', 'NM_BAIRRO'], '']
          });

          // Mark map as ready THEN load status colors
          this.mapReady = true;
          this.loadStatusBairros();
        });
    });

    this.map.on('click', 'municipios-layer', (e: maplibregl.MapLayerMouseEvent) => {
      if (!e.features || e.features.length === 0) return;
      const nomeMunicipio = e.features[0].properties['NM_BAIRRO'];
      this.searchTerm = nomeMunicipio;
      this.buscarRegiao(nomeMunicipio);
    });
  }

  loadStatusBairros(): void {
    if (!this.mapReady || !this.map || !this.map.isStyleLoaded()) return;
    this.mapaService.getStatusBairros().subscribe((statusData: StatusBairro[]) => {
      statusData.forEach((item: StatusBairro) => {
        if (item.bairro) {
          this.map.setFeatureState(
            { source: 'municipios', id: this.normalizarTexto(item.bairro) },
            { status: item.status }
          );
        }
      });
    });
  }

  onSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.buscarRegiao(this.searchTerm);
    }
  }

  doSearch(): void {
    this.buscarRegiao(this.searchTerm);
  }

  buscarRegiao(nome: string): void {
    if (!nome) {
      this.toastService.error('Digite um bairro!');
      return;
    }
    if (!this.municipiosData) {
      this.toastService.error('Mapa ainda carregando...');
      return;
    }

    const nomeBusca = this.normalizarTexto(nome);
    const feature = this.municipiosData.features.find((f: any) => this.normalizarTexto(f.properties.NM_BAIRRO) === nomeBusca);
    if (!feature) {
      this.toastService.error('Bairro não encontrado!');
      return;
    }

    const nomeExibicao = feature.properties.NM_BAIRRO;
    this.map.setFilter('municipios-layer-highlight', ['==', ['get', 'NM_BAIRRO'], nomeExibicao]);
    this.map.setFilter('municipios-line', ['==', ['get', 'NM_BAIRRO'], nomeExibicao]);

    const bbox = turf.bbox(feature) as [number, number, number, number];
    this.map.fitBounds(bbox, { padding: 40, duration: 1000 });

    this.abrirModalBairro(nomeExibicao, nomeBusca);
  }

  abrirModalBairro(nomeExibicao: string, nomeNormalizado: string): void {

    this.bairroSelecionado = null;
    this.painelStatusVisible = true;
    this.painelUpdateVisible = false;

    this.mapaService.getDetalhesBairro(nomeNormalizado).subscribe({

      next: (data: StatusBairro[]) => {

        if (data && data.length > 0) {

          this.bairroSelecionado = {
            ...data[0],
            bairro: data[0].bairro,
            bairroExibicao: nomeExibicao
          } as any;

        } else {
          this.toastService.error("Nenhum resultado encontrado.");
        }

      },

      error: (err) => {
        console.error(err);

        this.toastService.error(
          err.error?.erro ??
          err.error?.message ??
          "Erro ao buscar dados."
        );
      }
    });
  }

  fecharPainelStatus(): void {
    this.painelStatusVisible = false;
  }

  abrirPainelAtualizar(): void {
    if (!this.bairroSelecionado) return;

    this.formData = {

      idBairro: this.bairroSelecionado.bairro,

      bairroExibicao: (this.bairroSelecionado as any).bairroExibicao,

      status: this.bairroSelecionado.status,

      causa: this.bairroSelecionado.causa_interrupcao || '',

      inicio: this.formatDateForInput(this.bairroSelecionado.inicio_interrupcao),

      retorno: this.formatDateForInput(this.bairroSelecionado.previsao_retorno),

      area: this.bairroSelecionado.area_afetada || '',

      pressao: this.bairroSelecionado.pressao_rede || '',

      medida: this.bairroSelecionado.medida_solucao || '',

      descricao: this.bairroSelecionado.descricao || ''

    };

    this.onStatusChange();
    this.painelUpdateVisible = true;

    setTimeout(() => {
      document.getElementById('painelStatusUpdate')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }

  cancelarUpdate(): void {
    this.painelUpdateVisible = false;
    document.getElementById('map')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  onStatusChange(): void {
    if (this.formData.status !== 'NORMAL' && !this.formData.inicio) {
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      this.formData.inicio = now.toISOString().slice(0, 16);
    }
  }

  isNormal(): boolean {
    return this.formData.status === 'NORMAL';
  }

  atualizarStatus(): void {
    if (this.formData.status !== 'NORMAL') {
      const required = [this.formData.causa, this.formData.inicio, this.formData.retorno, this.formData.area, this.formData.pressao, this.formData.medida];
      if (required.some(val => !val)) {
        this.toastService.error('Preencha os campos obrigatórios');
        return;
      }
    }

    const payload = {
      status: this.formData.status,
      causa_interrupcao: this.isNormal() ? null : this.formData.causa,
      inicio_interrupcao: this.isNormal() ? null : this.formData.inicio,
      previsao_retorno: this.isNormal() ? null : this.formData.retorno,
      area_afetada: this.isNormal() ? null : this.formData.area,
      pressao_rede: this.isNormal() ? null : this.formData.pressao,
      medida_solucao: this.isNormal() ? null : this.formData.medida,
      descricao: this.isNormal() ? null : this.formData.descricao
    };

    this.mapaService.updateDadosBairro(this.formData.idBairro, payload).subscribe({

      next: (res: any) => {

        this.toastService.success(res.message);

        this.painelUpdateVisible = false;

        // Refresh map colors to reflect the new status
        this.loadStatusBairros();

        document.getElementById('map')
          ?.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });

        this.abrirModalBairro(
          this.formData.bairroExibicao,
          this.formData.idBairro
        );

      },

      error: (err) => {

        console.error(err);

        this.toastService.error(
          err.error?.erro ??
          err.error?.message ??
          "Erro na requisição."
        );

      }
    });
    
  }

  // Utils
  normalizarTexto(texto: string): string {
    return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s-]/g, '').replace(/\s+/g, ' ').trim();
  }

  formatDateStr(dateStr?: string): string {
    if (!dateStr) return '';
    const isUTC = dateStr.includes('T') ? false : true;
    const finalStr = isUTC ? dateStr + 'Z' : dateStr.replace(' ', 'T');
    const d = new Date(finalStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  formatDateForInput(dateStr?: string): string {
    if (!dateStr) return '';
    const isUTC = dateStr.includes('T') ? false : true;
    const finalStr = isUTC ? dateStr + 'Z' : dateStr.replace(' ', 'T');
    const d = new Date(finalStr);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 16);
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
}
